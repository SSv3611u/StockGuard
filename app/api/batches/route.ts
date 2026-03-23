import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { shouldBlockReorder } from "@/lib/reorderCheck";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function resolveShopIdFromAuth() {
  const session = await getSession();
  if (session?.shopId) return session.shopId;

  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const { data: authData } = await supabaseServer.auth.getUser();
  const user = authData.user;
  const email = user?.email?.toLowerCase().trim();
  const meta = (user?.user_metadata || {}) as {
    shop_id?: string;
    shop_name?: string;
    shopName?: string;
  };

  if (meta.shop_id) return meta.shop_id;

  const metaShopName = meta.shop_name || meta.shopName;
  if (metaShopName && typeof metaShopName === "string") {
    const { data: shopByName } = await supabaseServer
      .from("Shop")
      .select("id")
      .eq("name", metaShopName.trim())
      .maybeSingle();
    if (shopByName?.id) return shopByName.id;
  }

  if (!email) return null;

  const { data: shopkeeper } = await supabaseServer
    .from("Shopkeeper")
    .select("shopId")
    .eq("email", email)
    .maybeSingle();

  return shopkeeper?.shopId || null;
}

export async function GET(req: NextRequest) {
  const shopId = (await resolveShopIdFromAuth()) || req.nextUrl.searchParams.get("shopId");
  if (!shopId)
    return NextResponse.json({ error: "Unauthorized: shop context not found" }, { status: 401 });

  // Get product IDs for this shop first
  const { data: products } = await supabase
    .from("Product")
    .select("id")
    .eq("shopId", shopId);

  const productIds = (products || []).map((p: any) => p.id);
  if (productIds.length === 0) return NextResponse.json([]);

  const { data: batches } = await supabase
    .from("Batch")
    .select("*, product:Product(*), distributor:Distributor(*)")
    .in("productId", productIds)
    .order("expiryDate", { ascending: true });

  const today = new Date();
  const safeBatches = batches || [];
  const result = safeBatches.map((b: any) => ({
    ...b,
    daysUntilExpiry: Math.ceil(
      (new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  return NextResponse.json(result);
}

const BatchSchema = z.object({
  shopId: z.string().uuid().optional(),
  productName: z.string().min(1),
  batchNumber: z.string().optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantity: z.number().int().positive(),
  purchasePrice: z.number().positive().optional(),
  distributorName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BatchSchema.parse(await req.json());
    const resolvedShopId = (await resolveShopIdFromAuth()) || body.shopId;

    if (!resolvedShopId) {
      return NextResponse.json({ error: "Unauthorized: shop context not found" }, { status: 401 });
    }

    // Upsert product
    let { data: products } = await supabase
      .from("Product")
      .select("*")
      .eq("shopId", resolvedShopId)
      .eq("name", body.productName);

    let product = products?.[0];
    if (!product) {
      const { data: newProd } = await supabase
        .from("Product")
        .insert({ shopId: resolvedShopId, name: body.productName })
        .select()
        .single();
      product = newProd;
    }

    // Upsert distributor
    let distributorId: string | undefined;
    if (body.distributorName) {
      let { data: dists } = await supabase
        .from("Distributor")
        .select("*")
        .eq("shopId", resolvedShopId)
        .eq("name", body.distributorName);

      let dist = dists?.[0];
      if (!dist) {
        const { data: newDist } = await supabase
          .from("Distributor")
          .insert({ shopId: resolvedShopId, name: body.distributorName })
          .select()
          .single();
        dist = newDist;
      }
      distributorId = dist?.id;
    }

    // Create batch
    const { data: batch } = await supabase
      .from("Batch")
      .insert({
        productId: product.id,
        distributorId: distributorId ?? null,
        batchNumber: body.batchNumber ?? null,
        expiryDate: new Date(body.expiryDate).toISOString(),
        quantity: body.quantity,
        purchasePrice: body.purchasePrice ?? null,
      })
      .select()
      .single();

    // Reorder check
    const { data: existingBatches } = await supabase
      .from("Batch")
      .select("*")
      .eq("productId", product.id);

    const reorderWarning = shouldBlockReorder(
      (existingBatches || []).map((b: any) => ({
        expiryDate: b.expiryDate,
        quantity: b.quantity,
        purchasePrice: b.purchasePrice,
      })),
    );

    return NextResponse.json({
      batch,
      reorderWarning: reorderWarning.block ? reorderWarning : null,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

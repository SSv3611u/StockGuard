import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { shouldBlockReorder } from "@/lib/reorderCheck";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId)
    return NextResponse.json({ error: "shopId required" }, { status: 400 });

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
  shopId: z.string().uuid(),
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

    // Upsert product
    let { data: products } = await supabase
      .from("Product")
      .select("*")
      .eq("shopId", body.shopId)
      .eq("name", body.productName);

    let product = products?.[0];
    if (!product) {
      const { data: newProd } = await supabase
        .from("Product")
        .insert({ shopId: body.shopId, name: body.productName })
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
        .eq("shopId", body.shopId)
        .eq("name", body.distributorName);

      let dist = dists?.[0];
      if (!dist) {
        const { data: newDist } = await supabase
          .from("Distributor")
          .insert({ shopId: body.shopId, name: body.distributorName })
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

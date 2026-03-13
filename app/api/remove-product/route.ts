import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const RemoveProductSchema = z.object({
  shopId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  productName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = RemoveProductSchema.parse(await req.json());

    // Resolve productId if not provided
    let productId = body.productId;
    if (!productId) {
      const { data: productData, error: prodErr } = await supabase
        .from("Product")
        .select("id")
        .eq("shopId", body.shopId)
        .eq("name", body.productName)
        .single();
      
      if (prodErr || !productData) {
        return NextResponse.json({ error: "Product not found in this shop" }, { status: 404 });
      }
      productId = productData.id;
    }

    let remainingToRemove = body.quantity;
    const removedBatches: { id: string; removeAmt: number }[] = [];

    if (body.batchId) {
      // ── Remove from specific batch ──
      const { data: batch, error: batchErr } = await supabase
        .from("Batch")
        .select("*")
        .eq("id", body.batchId)
        .single();
        
      if (batchErr || !batch) {
        return NextResponse.json({ error: "Batch not found" }, { status: 404 });
      }

      if (batch.quantity <= 0) {
        return NextResponse.json({ error: "Batch is already empty" }, { status: 400 });
      }

      const removeAmt = Math.min(batch.quantity, remainingToRemove);
      removedBatches.push({ id: batch.id, removeAmt });
      remainingToRemove -= removeAmt;

    } else {
      // ── FIFO Logic: reduce from earliest-expiry batch first ──
      const { data: batches, error: batchesErr } = await supabase
        .from("Batch")
        .select("*")
        .eq("productId", productId)
        .gt("quantity", 0)
        .order("expiryDate", { ascending: true });

      if (batchesErr || !batches || batches.length === 0) {
        return NextResponse.json({ error: "No stock available for this product" }, { status: 400 });
      }

      for (const b of batches) {
        if (remainingToRemove <= 0) break;
        const removeAmt = Math.min(b.quantity, remainingToRemove);
        removedBatches.push({ id: b.id, removeAmt });
        remainingToRemove -= removeAmt;
      }
    }

    if (removedBatches.length === 0) {
      return NextResponse.json({ error: "Unable to find stock to remove" }, { status: 400 });
    }

    // ── Step 1: Update batch quantities in DB ──
    for (const rb of removedBatches) {
      const { data: current } = await supabase
        .from("Batch")
        .select("quantity")
        .eq("id", rb.id)
        .single();
      
      if (current) {
        const newQty = Math.max(0, current.quantity - rb.removeAmt);
        const { error: updateErr } = await supabase
          .from("Batch")
          .update({ quantity: newQty })
          .eq("id", rb.id);
        
        if (updateErr) {
          console.error("Failed to update batch quantity:", updateErr);
        }
      }
    }

    // ── Step 2: Record sale in Sales table ──
    const salesRecords = removedBatches.map(rb => ({
      shopId: body.shopId,
      productId: productId,
      batchId: rb.id,
      productName: body.productName,
      quantity: rb.removeAmt,
    }));

    const { error: salesErr } = await supabase.from("Sales").insert(salesRecords);
    if (salesErr) {
      // Sales table might not exist yet — log but don't fail the request
      console.warn("Sales insert warning:", salesErr.message);
    }

    const totalRemoved = body.quantity - remainingToRemove;

    return NextResponse.json({ 
      success: true,
      removed: totalRemoved,
      unfulfilled: remainingToRemove,
      message: remainingToRemove > 0
        ? `Only ${totalRemoved} units were available. ${remainingToRemove} units could not be fulfilled.`
        : `Successfully removed ${totalRemoved} units.`,
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("remove-product error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

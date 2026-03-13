import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendWhatsApp } from "@/lib/twilio";
import { buildExpiryAlert, buildReorderWarning } from "@/lib/alertMessages";

export async function GET(req: NextRequest) {
  // Validate cron secret
  const auth = req.headers.get("Authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  
  // Allow test param in dev
  const isTest = req.nextUrl.searchParams.get("test") === "1";
  
  if (!isTest && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let alertsSent = 0;
  let reorderWarningsSent = 0;

  try {
    // Get all shops
    const { data: shops } = await supabase.from("Shop").select("*");
    if (!shops?.length) return NextResponse.json({ alertsSent: 0, reorderWarningsSent: 0 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const shop of shops) {
      // Get all batches for this shop
      const { data: batches } = await supabase
        .from("Batch")
        .select("*, product:Product(*), distributor:Distributor(*)")
        .eq("product.shopId", shop.id)
        .gt("expiryDate", today.toISOString());

      if (!batches?.length) continue;

      for (const batch of batches) {
        const exp = new Date(batch.expiryDate);
        const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check each alert threshold
        const thresholds: Array<{ days: number; field: "alerted60" | "alerted30" | "alerted15" | "alerted7" }> = [
          { days: 60, field: "alerted60" },
          { days: 30, field: "alerted30" },
          { days: 15, field: "alerted15" },
          { days: 7, field: "alerted7" },
        ];

        for (const { days, field } of thresholds) {
          if (daysLeft <= days && !batch[field]) {
            const msg = buildExpiryAlert(
              shop.name,
              batch.product.name,
              batch.batchNumber,
              daysLeft,
              batch.quantity,
              batch.purchasePrice,
              batch.id
            );

            try {
              await sendWhatsApp(shop.whatsappNum, msg);
              await supabase
                .from("Batch")
                .update({ [field]: true })
                .eq("id", batch.id);
              alertsSent++;
            } catch (err) {
              console.error(`[Alert] Failed to send for batch ${batch.id}:`, err);
            }
            break; // Only send one alert per batch per cron run
          }
        }
      }

      // Reorder block check: group batches by product
      const productMap = new Map<string, typeof batches>();
      for (const b of batches) {
        const pid = b.productId;
        if (!productMap.has(pid)) productMap.set(pid, []);
        productMap.get(pid)!.push(b);
      }

      const cutoff = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      for (const [, productBatches] of productMap) {
        const atRisk = productBatches.filter((b) => {
          const exp = new Date(b.expiryDate);
          return exp > today && exp <= cutoff && b.quantity > 0;
        });
        if (atRisk.length === 0) continue;

        const soonest = atRisk.reduce((min, b) =>
          new Date(b.expiryDate) < new Date(min.expiryDate) ? b : min
        );
        const daysLeft = Math.ceil(
          (new Date(soonest.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const qty = atRisk.reduce((s, b) => s + b.quantity, 0);
        const value = Math.round(
          atRisk.reduce((s, b) => s + b.quantity * (b.purchasePrice ?? 0), 0)
        );

        const msg = buildReorderWarning(
          shop.name,
          soonest.product.name,
          qty,
          daysLeft,
          value
        );

        try {
          await sendWhatsApp(shop.whatsappNum, msg);
          reorderWarningsSent++;
        } catch (err) {
          console.error(`[Reorder] Failed:`, err);
        }
      }
    }

    return NextResponse.json({ alertsSent, reorderWarningsSent });
  } catch (err) {
    console.error("[Cron error]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendWhatsApp } from "@/lib/twilio";
import { buildExpiryAlert, buildReorderWarning, buildEscalationDraft } from "@/lib/alertMessages";
import { buildReturnMemo } from "@/lib/memoGenerator";
import { buildDiscountBroadcast } from "@/lib/broadcastGenerator";
import { getSession, setSession, clearSession } from "@/lib/sessionStore";
import { extractInvoiceItems } from "@/lib/gemini";

// Twilio always expects HTTP 200 with <Response></Response>
const twimlOk = (msg?: string) =>
  new NextResponse(
    msg
      ? `<Response><Message>${msg}</Message></Response>`
      : `<Response></Response>`,
    { status: 200, headers: { "Content-Type": "text/xml" } }
  );

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = (formData.get("From") as string) ?? "";
    const body = ((formData.get("Body") as string) ?? "").trim();
    const mediaUrl = formData.get("MediaUrl0") as string | null;

    // Normalize phone: strip "whatsapp:" prefix for DB lookups
    const phone = from.replace("whatsapp:", "");

    // Find the shop by whatsapp number
    const { data: shops } = await supabase
      .from("Shop")
      .select("*")
      .eq("whatsappNum", phone)
      .limit(1);

    const shop = shops?.[0];
    if (!shop) {
      // Unknown number — maybe onboarding later, for now just ack
      return twimlOk("Welcome to ExpiryGuard! Your number is not registered.");
    }

    const session = getSession(phone);

    // ─── HANDLE IMAGE (Invoice OCR via WhatsApp) ──────────────────────────
    if (mediaUrl) {
      try {
        // Twilio requires basic auth to download media
        const basicAuth = Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64");
        const imgRes = await fetch(mediaUrl, {
          headers: { Authorization: `Basic ${basicAuth}` },
        });
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

        // Upload to Supabase Storage first so we have a URL
        const fileName = `invoice_${Date.now()}.jpg`;
        const { data: uploadData } = await supabase.storage
          .from("invoices")
          .upload(fileName, Buffer.from(buffer), { contentType: mimeType });

        const { data: urlData } = supabase.storage
          .from("invoices")
          .getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl;

        // Run OCR
        const items = await extractInvoiceItems(imageUrl);

        if (!items || items.length === 0) {
          return twimlOk("Could not read invoice. Please send a clearer photo.");
        }

        // Store items in session for confirmation
        setSession(phone, {
          step: "awaiting_return_confirm",
          batchId: "multi",
          distributorId: "",
          productName: `${items.length} items`,
          batchNumber: null,
          expiryDate: "",
          quantity: 0,
          purchasePrice: null,
          distributorName: items[0]?.distributorName || "",
          shopName: shop.name,
        });

        // Save all automatically (no confirmation for OCR flow via WhatsApp)
        let saved = 0;
        for (const item of items) {
          if (!item.productName || !item.expiryDate) continue;

          // Upsert product
          let { data: products } = await supabase
            .from("Product")
            .select("*")
            .eq("shopId", shop.id)
            .eq("name", item.productName);
          let product = products?.[0];
          if (!product) {
            const { data: np } = await supabase
              .from("Product")
              .insert({ shopId: shop.id, name: item.productName })
              .select()
              .single();
            product = np;
          }
          if (!product) continue;

          // Upsert distributor
          let distributorId: string | null = null;
          if (item.distributorName) {
            let { data: dists } = await supabase
              .from("Distributor")
              .select("*")
              .eq("shopId", shop.id)
              .eq("name", item.distributorName);
            let dist = dists?.[0];
            if (!dist) {
              const { data: nd } = await supabase
                .from("Distributor")
                .insert({ shopId: shop.id, name: item.distributorName })
                .select()
                .single();
              dist = nd;
            }
            distributorId = dist?.id ?? null;
          }

          await supabase.from("Batch").insert({
            productId: product.id,
            distributorId,
            batchNumber: item.batchNumber,
            expiryDate: new Date(item.expiryDate).toISOString(),
            quantity: item.quantity ?? 1,
            purchasePrice: null,
          });
          saved++;
        }

        clearSession(phone);
        return twimlOk(
          `✅ Saved ${saved} items from invoice to ExpiryGuard!\n\nCheck your dashboard for the new batches.`
        );
      } catch (ocrErr) {
        console.error("[WhatsApp OCR error]", ocrErr);
        return twimlOk("Sorry, could not process the invoice image. Please try again.");
      }
    }

    // ─── SESSION STATE MACHINE ───────────────────────────────────────────
    if (session.step === "awaiting_return_outcome") {
      const upper = body.toUpperCase();
      if (upper === "A" || upper === "ACCEPTED") {
        await supabase
          .from("ReturnLog")
          .update({ outcome: "accepted" })
          .eq("batchId", session.batchId)
          .eq("distributorId", session.distributorId)
          .eq("outcome", "pending");
        clearSession(phone);
        return twimlOk("✅ Marked as *accepted*. Well done! Dashboard updated.");
      } else if (upper === "R" || upper === "REJECTED") {
        await supabase
          .from("ReturnLog")
          .update({ outcome: "rejected" })
          .eq("batchId", session.batchId)
          .eq("distributorId", session.distributorId)
          .eq("outcome", "pending");

        // Check for escalation
        const { data: logs } = await supabase
          .from("ReturnLog")
          .select("*")
          .eq("distributorId", session.distributorId)
          .eq("outcome", "rejected");

        clearSession(phone);
        const rejectedCount = logs?.length || 0;
        if (rejectedCount >= 2) {
          const { data: dist } = await supabase
            .from("Distributor")
            .select("name")
            .eq("id", session.distributorId)
            .single();
          const msg = buildEscalationDraft(
            dist?.name || "Distributor",
            "recent product",
            rejectedCount
          );
          return twimlOk(`❌ Marked as rejected.\n\n${msg}`);
        }
        return twimlOk("❌ Marked as *rejected*. Dashboard updated.");
      } else {
        return twimlOk("Please reply *A* for accepted or *R* for rejected.");
      }
    }

    if (session.step === "awaiting_broadcast_mrp") {
      const mrp = parseFloat(body);
      if (isNaN(mrp)) {
        return twimlOk("Please reply with the MRP as a number (e.g., 120)");
      }
      const broadcast = buildDiscountBroadcast(session.shopName, session.productName, mrp);
      clearSession(phone);
      return twimlOk(
        `Here's your discount broadcast message — copy and forward to your customer list:\n\n${broadcast}`
      );
    }

    // ─── HANDLE NUMBERED REPLIES TO ALERTS ──────────────────────────────
    // Look for most recent pending alert for this shop
    if (body === "1" || body === "2") {
      const { data: batches } = await supabase
        .from("Batch")
        .select("*, product:Product(*), distributor:Distributor(*)")
        .eq("product.shopId", shop.id)
        .order("expiryDate", { ascending: true })
        .limit(1);

      const batch = batches?.[0];
      if (!batch) {
        return twimlOk("No active alert found. Check your dashboard.");
      }

      if (body === "1") {
        // Return memo
        const expiryStr = new Date(batch.expiryDate).toLocaleDateString("en-IN");
        const memo = buildReturnMemo(
          shop.name,
          batch.distributor?.name || "Distributor",
          batch.product.name,
          batch.batchNumber,
          expiryStr,
          batch.quantity,
          batch.purchasePrice
        );

        // Log the return
        if (batch.distributorId) {
          await supabase.from("ReturnLog").insert({
            batchId: batch.id,
            distributorId: batch.distributorId,
            outcome: "pending",
          });
          setSession(phone, {
            step: "awaiting_return_outcome",
            batchId: batch.id,
            distributorId: batch.distributorId,
          });
        }

        return twimlOk(
          `${memo}\n\n📤 Forward this to your distributor.\n\nOnce they respond, reply:\n*A* — Accepted\n*R* — Rejected`
        );
      } else {
        // Discount broadcast
        setSession(phone, {
          step: "awaiting_broadcast_mrp",
          batchId: batch.id,
          productName: batch.product.name,
          shopName: shop.name,
        });
        return twimlOk(
          `What is the MRP for *${batch.product.name}*? Reply with the price in ₹ (e.g., 120)`
        );
      }
    }

    // Default: show status
    return twimlOk(
      `👋 Hi! Send an invoice photo to track stock, or reply to an alert (1/2) to take action.\n\nVisit your dashboard for full details.`
    );
  } catch (err) {
    console.error("[Webhook error]", err);
    // MUST always return 200 for Twilio
    return twimlOk();
  }
}

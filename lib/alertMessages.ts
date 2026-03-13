// Pure functions: build WhatsApp alert message strings

export function buildExpiryAlert(
  shopName: string,
  productName: string,
  batchNumber: string | null,
  daysLeft: number,
  quantity: number,
  purchasePrice: number | null,
  batchId: string
): string {
  const value = purchasePrice ? `₹${Math.round(quantity * purchasePrice).toLocaleString("en-IN")}` : "price not set";
  const urgency = daysLeft <= 7 ? "🔴 URGENT" : daysLeft <= 15 ? "🔴 ACTION NEEDED" : "🟡 REMINDER";

  return `${urgency} — ${shopName}

📦 ${productName}${batchNumber ? ` (Batch: ${batchNumber})` : ""}
⏳ Expires in *${daysLeft} days*
🗑️ ${quantity} units at risk
💸 Value: ${value}

Reply:
*1* — Send return memo to distributor
*2* — Create discount broadcast for customers`;
}

export function buildReorderWarning(
  shopName: string,
  productName: string,
  quantity: number,
  daysLeft: number,
  atRiskValue: number
): string {
  return `⛔ Reorder Warning — ${shopName}

Don't reorder *${productName}* yet.
You have *${quantity} units* expiring in *${daysLeft} days*.
Value at risk: ₹${atRiskValue.toLocaleString("en-IN")}

Sell or return existing stock first.`;
}

export function buildEscalationDraft(
  distributorName: string,
  productName: string,
  rejectedCount: number
): string {
  return `⚠️ Escalation Draft — ${distributorName}

This distributor has rejected ${rejectedCount} return requests including *${productName}*.

Forward this to your area sales manager or switch distributor.
"Dear sir, ${distributorName} has repeatedly rejected valid expiry returns. Request resolution."`;
}

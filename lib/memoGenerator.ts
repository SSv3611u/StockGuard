// Pure function: build return memo string for forwarding to distributor

export function buildReturnMemo(
  shopName: string,
  distributorName: string,
  productName: string,
  batchNumber: string | null,
  expiryDate: string,
  quantity: number,
  purchasePrice: number | null
): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const value = purchasePrice ? `₹${(quantity * purchasePrice).toLocaleString("en-IN")}` : "—";

  return `📋 *RETURN MEMO*
Date: ${date}

From: *${shopName}*
To: *${distributorName}*

Product: ${productName}
Batch No: ${batchNumber || "N/A"}
Expiry Date: ${expiryDate}
Quantity: ${quantity} units
Value: ${value}

*Reason: Near-expiry stock — requesting return/credit note*

Please acknowledge receipt and confirm credit within 7 days.`;
}

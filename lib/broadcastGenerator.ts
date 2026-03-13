// Pure function: build discount broadcast message for customer broadcast list

export function buildDiscountBroadcast(
  shopName: string,
  productName: string,
  mrp: number,
  discountPercent: number = 25
): string {
  const salePrice = Math.round(mrp * (1 - discountPercent / 100));

  return `🎉 *Special Offer — ${shopName}*

📦 *${productName}*
MRP: ~~₹${mrp}~~
*Sale Price: ₹${salePrice}* (${discountPercent}% OFF)

⚡ Limited stock — grab it before it's gone!
📍 Visit us in store today.`;
}

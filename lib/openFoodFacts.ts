export interface BarcodeProduct {
  productName: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
}

export async function lookupBarcode(code: string): Promise<BarcodeProduct> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
    );
    const data = await res.json();
    if (data.status !== 1) return { productName: null, brand: null, category: null, imageUrl: null };
    const product = data.product;
    return {
      productName: product?.product_name_en || product?.product_name || null,
      brand: product?.brands || null,
      category: product?.categories?.split(",")[0]?.trim() || null,
      imageUrl: product?.image_front_small_url || null,
    };
  } catch {
    return { productName: null, brand: null, category: null, imageUrl: null };
  }
}

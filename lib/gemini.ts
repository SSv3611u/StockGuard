import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `This is a distributor invoice from an Indian retail supply chain.
Extract all product line items and return ONLY a valid JSON array.
No explanation, no markdown, just the raw JSON array.

Each object must have these exact keys:
{
  "productName": "string — full product name including dosage/size if visible",
  "batchNumber": "string — batch or lot number, or null if not found",
  "expiryDate": "string — in YYYY-MM-DD format, or null if not found",
  "quantity": number — integer units, or null if not found,
  "distributorName": "string — supplier/distributor name from invoice header, or null"
}

If a field is not legible or not present, use null. Do not guess.
Return only the JSON array, nothing else.`;

export interface OcrItem {
  productName: string;
  batchNumber: string | null;
  expiryDate: string | null;
  quantity: number | null;
  distributorName: string | null;
}

export async function extractInvoiceItems(imageUrl: string): Promise<OcrItem[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Fetch the image and convert to base64
  const imgRes = await fetch(imageUrl);
  const buffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
        data: base64,
      },
    },
  ]);

  const text = result.response.text().trim();
  // Strip markdown code fences if Gemini adds them
  const clean = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(clean) as OcrItem[];
}

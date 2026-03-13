import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceItems } from "@/lib/gemini";
import { z } from "zod";

const Schema = z.object({ imageUrl: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    const body = Schema.parse(await req.json());
    const items = await extractInvoiceItems(body.imageUrl);
    return NextResponse.json({ items });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues }, { status: 400 });
    if (err instanceof SyntaxError)
      return NextResponse.json(
        { error: "Could not read invoice. Please try a clearer photo." },
        { status: 422 }
      );
    console.error("[OCR Error]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

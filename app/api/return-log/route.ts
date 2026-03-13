import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const LogSchema = z.object({
  batchId: z.string().uuid(),
  distributorId: z.string().uuid(),
  outcome: z.enum(["pending", "accepted", "rejected"]).default("pending"),
});

export async function POST(req: NextRequest) {
  try {
    const body = LogSchema.parse(await req.json());

    const { data: returnLog, error } = await supabase
      .from("ReturnLog")
      .insert({
        batchId: body.batchId,
        distributorId: body.distributorId,
        outcome: body.outcome,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ returnLog });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

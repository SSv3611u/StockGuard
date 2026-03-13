import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId)
    return NextResponse.json({ error: "shopId required" }, { status: 400 });

  const { data: distributors, error } = await supabase
    .from("Distributor")
    .select("*, returnLogs:ReturnLog(*)")
    .eq("shopId", shopId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (distributors || []).map((d: any) => {
    const totalReturns = d.returnLogs?.length || 0;
    const accepted = d.returnLogs?.filter((r: any) => r.outcome === "accepted").length || 0;
    const rejected = d.returnLogs?.filter((r: any) => r.outcome === "rejected").length || 0;
    
    return {
      id: d.id,
      name: d.name,
      totalReturns,
      accepted,
      reliabilityScore: totalReturns > 0 ? accepted / totalReturns : 1.0,
      hasEscalation: rejected >= 2,
    };
  });

  return NextResponse.json(result);
}

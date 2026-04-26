import { NextRequest, NextResponse } from "next/server";
import { insertAnalyzeOutcome, fetchAnalyzeOutcomes } from "@/lib/db";

export async function GET() {
  const outcomes = await fetchAnalyzeOutcomes(50);
  return NextResponse.json({ outcomes });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await insertAnalyzeOutcome({
      conversation_id: body.conversation_id ?? null,
      followed: body.followed,
      outcome: body.outcome,
      situation_summary: body.situation_summary ?? null,
      recommended_action: body.recommended_action ?? null,
      recommended_message: body.recommended_message ?? null,
      what_not_to_do: body.what_not_to_do ?? null,
      notes: body.notes ?? null,
    });
    return NextResponse.json({ ok: true, outcome: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save outcome" }, { status: 500 });
  }
}

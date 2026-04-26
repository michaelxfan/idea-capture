import { NextRequest, NextResponse } from "next/server";
import { fetchOutcomes, insertOutcome } from "@/lib/db";
import type { RepairOutcome } from "@/lib/types";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const outcomes = await fetchOutcomes(limit);
  return NextResponse.json({ outcomes });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const outcome: Omit<RepairOutcome, "id" | "created_at"> = {
      log_date: body.log_date,
      drift_level: body.drift_level,
      message_used: body.message_used ?? null,
      action_taken: body.action_taken ?? null,
      landed: body.landed ?? null,
      overdid: body.overdid ?? null,
      underdid: body.underdid ?? null,
      notes: body.notes ?? null,
    };
    const result = await insertOutcome(outcome);
    return NextResponse.json({ ok: true, outcome: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save outcome" }, { status: 500 });
  }
}

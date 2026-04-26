import { NextRequest, NextResponse } from "next/server";
import { fetchRecentLogs, insertLog } from "@/lib/db";
import type { DailyLog } from "@/lib/types";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "14");
  const logs = await fetchRecentLogs(limit);
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const log: Omit<DailyLog, "id" | "created_at"> = {
      profile_id: body.profile_id ?? null,
      log_date: body.log_date,
      replied_consistently: body.replied_consistently,
      initiated_contact: body.initiated_contact,
      meaningful_connection: body.meaningful_connection,
      guilt_flags: body.guilt_flags ?? [],
      operator_mode: body.operator_mode,
      notes: body.notes ?? null,
    };
    const result = await insertLog(log);
    return NextResponse.json({ ok: true, log: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}

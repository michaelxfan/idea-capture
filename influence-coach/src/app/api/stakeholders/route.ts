import { NextRequest, NextResponse } from "next/server";
import { listStakeholders, upsertStakeholder } from "@/lib/db";

export async function GET() {
  const rows = await listStakeholders();
  return NextResponse.json({ stakeholders: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const created = await upsertStakeholder(body);
  if (!created) return NextResponse.json({ error: "upsert failed" }, { status: 500 });
  return NextResponse.json({ stakeholder: created });
}

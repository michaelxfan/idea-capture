import { NextRequest, NextResponse } from "next/server";
import { listLedger, addLedgerEntry, deleteLedgerEntry } from "@/lib/db";

export async function GET() {
  const entries = await listLedger();
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await addLedgerEntry({
    stakeholderId: body.stakeholderId,
    direction: body.direction,
    description: body.description,
    occurredOn: body.occurredOn ?? new Date().toISOString().slice(0, 10),
  });
  if (!entry) return NextResponse.json({ error: "save failed" }, { status: 500 });
  return NextResponse.json({ entry });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await deleteLedgerEntry(id);
  return NextResponse.json({ ok: true });
}

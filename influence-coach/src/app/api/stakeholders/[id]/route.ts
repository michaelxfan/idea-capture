import { NextRequest, NextResponse } from "next/server";
import {
  deleteStakeholder,
  getGoals,
  getLatestInsights,
  getReverse,
  getStakeholder,
  upsertStakeholder,
} from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [stakeholder, goals, reverse, insights] = await Promise.all([
    getStakeholder(id),
    getGoals(id),
    getReverse(id),
    getLatestInsights(id),
  ]);
  if (!stakeholder) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ stakeholder, goals, reverse, insights });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await upsertStakeholder({ ...body, id });
  if (!updated) return NextResponse.json({ error: "update failed" }, { status: 500 });
  return NextResponse.json({ stakeholder: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteStakeholder(id);
  return NextResponse.json({ ok: true });
}

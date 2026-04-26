import { NextRequest, NextResponse } from "next/server";
import { getGoals, upsertGoals } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goals = await getGoals(id);
  return NextResponse.json({ goals });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const saved = await upsertGoals({
    ...body,
    stakeholderId: id,
    priorityLevel: Number(body.priorityLevel ?? 3),
    status: body.status ?? "open",
  });
  if (!saved) return NextResponse.json({ error: "save failed" }, { status: 500 });
  return NextResponse.json({ goals: saved });
}

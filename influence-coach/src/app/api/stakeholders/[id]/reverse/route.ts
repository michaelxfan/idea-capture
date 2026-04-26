import { NextRequest, NextResponse } from "next/server";
import { getReverse, upsertReverse } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reverse = await getReverse(id);
  return NextResponse.json({ reverse });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const saved = await upsertReverse({ ...body, stakeholderId: id });
  if (!saved) return NextResponse.json({ error: "save failed" }, { status: 500 });
  return NextResponse.json({ reverse: saved });
}

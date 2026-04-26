import { NextRequest, NextResponse } from "next/server";
import { getDependencies, upsertDependencies } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deps = await getDependencies(id);
  return NextResponse.json({ dependencies: deps });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const saved = await upsertDependencies({
    stakeholderId: id,
    blocks: body.blocks ?? [],
    blockedBy: body.blockedBy ?? [],
  });
  if (!saved) return NextResponse.json({ error: "save failed" }, { status: 500 });
  return NextResponse.json({ dependencies: saved });
}

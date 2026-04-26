import { NextRequest, NextResponse } from "next/server";
import { getLatestGapAnalysis, updateGapSteps } from "@/lib/db";
import type { GapStep } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ga = await getLatestGapAnalysis(id);
  return NextResponse.json({ gapAnalysis: ga });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { steps } = await req.json() as { steps: GapStep[] };
  const ga = await getLatestGapAnalysis(id);
  if (!ga) return NextResponse.json({ error: "not found" }, { status: 404 });
  await updateGapSteps(ga.id, steps);
  return NextResponse.json({ ok: true });
}

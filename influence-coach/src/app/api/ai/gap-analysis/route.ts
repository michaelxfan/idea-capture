import { NextRequest, NextResponse } from "next/server";
import { getStakeholder, getGoals, getReverse, saveGapAnalysis } from "@/lib/db";
import { callClaudeJson, hasAnthropicKey } from "@/lib/anthropic";
import { stakeholderContext, GAP_ANALYSIS_SYSTEM, GAP_ANALYSIS_SCHEMA } from "@/lib/prompts";
import type { GapStep } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { stakeholderId } = await req.json();
  const [s, g, r] = await Promise.all([
    getStakeholder(stakeholderId),
    getGoals(stakeholderId),
    getReverse(stakeholderId),
  ]);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!hasAnthropicKey()) {
    const stubSteps: GapStep[] = [
      { label: "Schedule a 1:1 to understand their current priorities", done: false },
      { label: "Share a quick win or data point that affects their scorecard", done: false },
      { label: "Make a specific, low-risk offer of support", done: false },
      { label: "Co-create a shared goal or metric", done: false },
      { label: "Request their formal endorsement on a key initiative", done: false },
    ];
    const saved = await saveGapAnalysis(stakeholderId, stubSteps);
    return NextResponse.json({ gapAnalysis: saved, mock: true });
  }

  const ctx = stakeholderContext(s, g ?? undefined, r ?? undefined);
  const prompt = `${ctx}

Current relationship: ${s.relationshipStrength}
Target: sponsor-level alignment

${GAP_ANALYSIS_SCHEMA}`;

  const result = await callClaudeJson<{ steps: { label: string }[] }>({
    system: GAP_ANALYSIS_SYSTEM,
    user: prompt,
  });

  const steps: GapStep[] = (result?.steps ?? []).map((st) => ({ label: st.label, done: false }));
  const saved = await saveGapAnalysis(stakeholderId, steps);
  return NextResponse.json({ gapAnalysis: saved });
}

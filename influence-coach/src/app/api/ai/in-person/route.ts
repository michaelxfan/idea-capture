import { NextResponse } from "next/server";
import { callClaudeJson, hasAnthropicKey } from "@/lib/anthropic";
import { IN_PERSON_SCHEMA, IN_PERSON_SYSTEM } from "@/lib/prompts";
import { getGoals, getLatestInsights, getReverse, listStakeholders } from "@/lib/db";
import type { Stakeholder, StakeholderGoals, ReverseValue } from "@/lib/types";

export const maxDuration = 60;

interface RankedItem {
  stakeholderId: string;
  name: string;
  rank: number;
  whyToday: string;
  talkingPoints: string[];
  smallNudge: string;
  doNotBringUpYet: string;
  leaveWith: string;
}

function stubRanking(inOffice: Array<{ s: Stakeholder; g: StakeholderGoals | null }>): RankedItem[] {
  return inOffice.map((x, i) => ({
    stakeholderId: x.s.id,
    name: x.s.name,
    rank: i + 1,
    whyToday: x.g?.goal1m
      ? `You have an open 1-month ask with ${x.s.name} that isn't moving.`
      : `${x.s.name} has influence over ${x.s.team || "your area"} — a warm touch today compounds.`,
    talkingPoints: [
      x.g?.goal1m ? `Soft check-in on: ${x.g.goal1m}` : "Ask what's on top of their mind this week",
      "Share one recent ecommerce win they can reference",
    ],
    smallNudge: x.g?.blockers
      ? `Mention the blocker: ${x.g.blockers}`
      : "Drop a one-liner about an upcoming launch they'll care about",
    doNotBringUpYet: "Budget or headcount asks — not the right context today.",
    leaveWith: "A specific next step with a date attached.",
  }));
}

export async function POST() {
  const all = await listStakeholders();
  const inOffice = all.filter((s) => s.isInOffice);
  if (inOffice.length === 0) {
    return NextResponse.json({ ranked: [], message: "No one marked as in office today." });
  }

  const withContext = await Promise.all(
    inOffice.map(async (s) => ({
      s,
      g: await getGoals(s.id),
      r: await getReverse(s.id),
      latest: await getLatestInsights(s.id),
    }))
  );

  if (!hasAnthropicKey()) {
    return NextResponse.json({ ranked: stubRanking(withContext), mock: true });
  }

  const context = withContext
    .map(
      ({ s, g, r }: { s: Stakeholder; g: StakeholderGoals | null; r: ReverseValue | null }) => `
Stakeholder ID: ${s.id}
Name: ${s.name}
Title: ${s.title}
Team: ${s.team}
Influence: ${s.influenceScore}/5  Relationship: ${s.relationshipStrength}
My 1m ask: ${g?.goal1m ?? "—"}
My 3m ask: ${g?.goal3m ?? "—"}
Blockers: ${g?.blockers ?? "—"}
Priority: ${g?.priorityLevel ?? "—"}/5  Status: ${g?.status ?? "—"}
What I can offer: ${r?.whatIOffer ?? "—"}
`
    )
    .join("\n---\n");

  try {
    const data = await callClaudeJson<{ ranked: RankedItem[] }>({
      system: IN_PERSON_SYSTEM,
      user: `Here are the stakeholders in the office with me today. Rank the conversations I should prioritize and tell me exactly what to say.\n\n${context}\n\n${IN_PERSON_SCHEMA}`,
      maxTokens: 2200,
      temperature: 0.5,
    });
    return NextResponse.json({ ranked: data.ranked ?? [], mock: false });
  } catch (err) {
    console.error("in-person Claude failed:", err);
    return NextResponse.json({ ranked: stubRanking(withContext), mock: true });
  }
}

import { NextResponse } from "next/server";
import { listStakeholders, getGoals } from "@/lib/db";
import { callClaudeJson, hasAnthropicKey } from "@/lib/anthropic";
import { ALIGNMENT_COUNCIL_SYSTEM, ALIGNMENT_COUNCIL_SCHEMA } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function POST() {
  const all = await listStakeholders();
  const withGoals = await Promise.all(
    all.map(async (s) => ({ s, g: await getGoals(s.id) }))
  );

  const allies = withGoals.filter(
    (x) => x.s.relationshipStrength === "aligned" || x.s.relationshipStrength === "sponsor"
  );
  const blocked = withGoals.filter(
    (x) => x.g?.status === "blocked" || x.g?.status === "in_progress"
  );

  if (allies.length === 0) {
    return NextResponse.json({ pairings: [], message: "No aligned allies yet." });
  }

  if (!hasAnthropicKey()) {
    const pairings = allies.slice(0, 2).flatMap((ally) =>
      blocked.slice(0, 2).map((b) => ({
        allyName: ally.s.name,
        allyId: ally.s.id,
        unlocksAsk: b.g?.goal1m ?? b.g?.goal3m ?? "key initiative",
        targetName: b.s.name,
        targetId: b.s.id,
        rationale: `${ally.s.name} has direct visibility into ${b.s.name}'s priorities and credibility to advocate.`,
        enlistmentDraft: `Hi ${ally.s.name}, I wanted to loop you in on something I'm working through with ${b.s.name}. Your perspective would carry real weight here — would you have 10 minutes to chat this week? Happy to share the context in advance.`,
      }))
    );
    return NextResponse.json({ pairings, mock: true });
  }

  const context = [
    "Allies (aligned/sponsor):",
    ...allies.map((x) => `- ${x.s.name} (${x.s.title}): ${x.g?.goal1m ?? "no specific ask"}`),
    "\nBlocked/in-progress asks:",
    ...blocked.map((x) => `- ${x.s.name} [${x.s.id}]: ${x.g?.goal1m ?? x.g?.goal3m ?? "ask"} | blockers: ${x.g?.blockers ?? "none stated"}`),
    "\nAllies with IDs:",
    ...allies.map((x) => `- ${x.s.name} [${x.s.id}] (${x.s.title})`),
  ].join("\n");

  const result = await callClaudeJson<{ pairings: unknown[] }>({
    system: ALIGNMENT_COUNCIL_SYSTEM,
    user: `${context}\n\n${ALIGNMENT_COUNCIL_SCHEMA}`,
  });

  return NextResponse.json({ pairings: result?.pairings ?? [] });
}

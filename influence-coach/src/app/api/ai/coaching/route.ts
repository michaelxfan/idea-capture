import { NextRequest, NextResponse } from "next/server";
import { callClaudeJson, hasAnthropicKey } from "@/lib/anthropic";
import { COACHING_SCHEMA, COACHING_SYSTEM, stakeholderContext } from "@/lib/prompts";
import { getGoals, getReverse, getStakeholder } from "@/lib/db";

export const maxDuration = 60;

interface Coaching {
  strengths: string[];
  gaps: string[];
  riskiestAssumption: string;
  biggestLeverage: string;
  practiceScript: string;
}

function stub(name: string): Coaching {
  return {
    strengths: [
      "You've documented a clear 1-month ask.",
      "You know what this person can unblock.",
    ],
    gaps: [
      "Reverse value is light — you haven't named what YOU'RE offering in trade.",
      "No recent in-person reinforcement logged.",
    ],
    riskiestAssumption: `That ${name} will prioritize your ask without a concrete trade attached.`,
    biggestLeverage: `Attach one specific trade to your ask before the next conversation with ${name}.`,
    practiceScript: `"${name}, I know Q2 is tight. I have an idea that moves both our numbers — can I take 15 minutes on Thursday to walk you through it?"`,
  };
}

export async function POST(req: NextRequest) {
  const { stakeholderId } = await req.json();
  if (!stakeholderId) return NextResponse.json({ error: "stakeholderId required" }, { status: 400 });
  const [s, g, r] = await Promise.all([
    getStakeholder(stakeholderId),
    getGoals(stakeholderId),
    getReverse(stakeholderId),
  ]);
  if (!s) return NextResponse.json({ error: "stakeholder not found" }, { status: 404 });

  if (!hasAnthropicKey()) {
    return NextResponse.json({ coaching: stub(s.name), mock: true });
  }
  try {
    const user = `${stakeholderContext(s, g ?? undefined, r ?? undefined)}\n\n${COACHING_SCHEMA}`;
    const data = await callClaudeJson<Coaching>({
      system: COACHING_SYSTEM,
      user,
      maxTokens: 1200,
      temperature: 0.4,
    });
    return NextResponse.json({ coaching: data, mock: false });
  } catch (err) {
    console.error("coaching Claude failed:", err);
    return NextResponse.json({ coaching: stub(s.name), mock: true });
  }
}

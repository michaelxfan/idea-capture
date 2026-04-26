import { NextRequest, NextResponse } from "next/server";
import { callClaudeJson, hasAnthropicKey } from "@/lib/anthropic";
import { REVERSE_VALUE_SCHEMA, REVERSE_VALUE_SYSTEM, stakeholderContext } from "@/lib/prompts";
import { getGoals, getReverse, getStakeholder } from "@/lib/db";

export const maxDuration = 60;

interface ReverseJson {
  howIHelpThem: string[];
  whatICanOffer: string[];
  outcomesTheyCareAbout: string[];
  thisWeek: string[];
  thisMonth: string[];
  thisQuarter: string[];
}

function stubFor(name: string): ReverseJson {
  return {
    howIHelpThem: [
      "Real-time ecommerce signal they wouldn't otherwise see.",
      "Performance marketing ROI translated into their KPI language.",
    ],
    whatICanOffer: [
      "A quarterly ecommerce readout tailored to their team.",
      "Access to our TikTok Shop / Amazon creative testing pipeline.",
    ],
    outcomesTheyCareAbout: [
      "Revenue predictability",
      "Reduced reliance on discounting",
      "Cleaner inventory turns",
    ],
    thisWeek: [`Send ${name} a 2-paragraph note highlighting a win they can take credit for.`],
    thisMonth: [`Offer to co-present one data slide in ${name}'s next leadership review.`],
    thisQuarter: [`Propose a single joint goal ${name} and I will both be scored on.`],
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
    return NextResponse.json({ data: stubFor(s.name), mock: true });
  }
  try {
    const user = `${stakeholderContext(s, g ?? undefined, r ?? undefined)}\n\n${REVERSE_VALUE_SCHEMA}`;
    const data = await callClaudeJson<ReverseJson>({
      system: REVERSE_VALUE_SYSTEM,
      user,
      maxTokens: 1400,
      temperature: 0.5,
    });
    return NextResponse.json({ data, mock: false });
  } catch (err) {
    console.error("reverse-value Claude call failed:", err);
    return NextResponse.json({ data: stubFor(s.name), mock: true });
  }
}

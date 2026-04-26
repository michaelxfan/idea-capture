import { NextRequest, NextResponse } from "next/server";
import { callClaudeJson, hasAnthropicKey } from "@/lib/anthropic";
import { INSIGHTS_SCHEMA_INSTRUCTIONS, INSIGHTS_SYSTEM, stakeholderContext } from "@/lib/prompts";
import { getGoals, getReverse, getStakeholder, saveInsights } from "@/lib/db";

export const maxDuration = 60;

interface InsightsJson {
  roleSynergies: string[];
  influenceRecommendations: string[];
  framingRecommendations: string[];
  likelyObjections: string[];
  recommendedLanguage: string[];
  inPersonTalkingPoints: string[];
  nextBestAction: string;
}

function stubFor(name: string, title: string): InsightsJson {
  return {
    roleSynergies: [
      `${title || "This role"} likely shares revenue or launch accountability with ecommerce.`,
      "Budget pressure and growth targets create natural alignment.",
      "Your performance marketing data is a unique asset for their decisions.",
    ],
    influenceRecommendations: [
      `Bring ${name} one decision they can make this week, not a status update.`,
      "Lead with their KPI, not yours.",
      "Quantify the downside of inaction.",
    ],
    framingRecommendations: [
      "Frame as de-risking, not as a new ask.",
      "Anchor on Q-to-date trend, then the proposal.",
      "Offer two options, recommend one.",
    ],
    likelyObjections: [
      "Budget already allocated elsewhere.",
      "Concerns about operational readiness.",
      "Prefers a pilot before committing.",
    ],
    recommendedLanguage: [
      `"I want to make sure we don't lose the Q on a solvable issue — can I have 10 minutes?"`,
      `"Here's the one decision I need from you — I've done the analysis."`,
    ],
    inPersonTalkingPoints: [
      "Quick win you can credit them with.",
      "One data point that changed this week.",
      "The single blocker you need their help on.",
    ],
    nextBestAction: `Send ${name} a 3-bullet brief with one decision to make, by Friday.`,
  };
}

export async function POST(req: NextRequest) {
  const { stakeholderId } = await req.json();
  if (!stakeholderId) {
    return NextResponse.json({ error: "stakeholderId required" }, { status: 400 });
  }
  const [s, g, r] = await Promise.all([
    getStakeholder(stakeholderId),
    getGoals(stakeholderId),
    getReverse(stakeholderId),
  ]);
  if (!s) return NextResponse.json({ error: "stakeholder not found" }, { status: 404 });

  let data: InsightsJson;
  if (!hasAnthropicKey()) {
    data = stubFor(s.name, s.title);
  } else {
    try {
      const user = `${stakeholderContext(s, g ?? undefined, r ?? undefined)}\n\n${INSIGHTS_SCHEMA_INSTRUCTIONS}`;
      data = await callClaudeJson<InsightsJson>({
        system: INSIGHTS_SYSTEM,
        user,
        maxTokens: 1800,
        temperature: 0.45,
      });
    } catch (err) {
      console.error("insights Claude call failed:", err);
      data = stubFor(s.name, s.title);
    }
  }

  const saved = await saveInsights({
    stakeholderId,
    roleSynergies: data.roleSynergies ?? [],
    influenceRecommendations: data.influenceRecommendations ?? [],
    framingRecommendations: data.framingRecommendations ?? [],
    likelyObjections: data.likelyObjections ?? [],
    recommendedLanguage: data.recommendedLanguage ?? [],
    inPersonTalkingPoints: data.inPersonTalkingPoints ?? [],
    nextBestAction: data.nextBestAction ?? "",
  });

  return NextResponse.json({ insights: saved, mock: !hasAnthropicKey() });
}

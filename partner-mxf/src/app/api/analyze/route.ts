import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { PartnerProfile, AnalysisResult, FollowUpResponse } from "@/lib/types";
import {
  createConversation,
  appendMessage,
  fetchRecentConversationSummaries,
} from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildProfileContext(profile: PartnerProfile | null): string {
  if (!profile) return "";

  const repairRanking = profile.repair_style_ranking.length > 0
    ? profile.repair_style_ranking.map((s, i) => `${i + 1}. ${s}`).join(", ")
    : profile.repair_style;

  return `
PARTNER BEHAVIORAL PROFILE:
- Name: ${profile.name || "Partner"}
- Attachment Style: ${profile.attachment_style ?? "Unknown"}
- MBTI: ${profile.mbti ?? "Unknown"}
- Core Tension: ${profile.core_tension ?? "Not set"}
- Push-Pull Tendency: ${profile.push_pull_tendency ?? "Unknown"}
- Trust Curve: ${profile.trust_curve ?? "Not set"}
- Repair Priority (1=highest): ${repairRanking}
- Communication Sensitivity: External ${profile.comm_sensitivity}, Internal ${profile.comm_sensitivity_internal ?? profile.comm_sensitivity}${profile.comm_sensitivity_note ? `. Note: ${profile.comm_sensitivity_note}` : ""}
- Gift Sensitivity: ${profile.gift_sensitivity}${profile.gift_sensitivity_note ? `. Note: ${profile.gift_sensitivity_note}` : ""}
- Best Connection: Primary ${profile.best_connection_format}${profile.best_connection_secondary ? `, Secondary ${profile.best_connection_secondary}` : ""}${profile.best_connection_note ? `. Note: ${profile.best_connection_note}` : ""}
- Triggers: ${profile.trigger_profile.join("; ")}
- Stress Response: ${profile.stress_response.join("; ")}
- Re-engagement Pattern: ${profile.reengagement_pattern ?? "Not set"}
- Trust Builders: ${profile.trust_builders.join("; ")}
- Trust Breakers: ${profile.trust_breakers.join("; ")}

BEHAVIORAL RULES (apply to every recommendation):
1. Attachment is ${profile.attachment_style ?? "unknown"}${profile.attachment_style?.toLowerCase().includes("fearful") ? " — prioritize low-pressure, consistent, non-performative actions. Never recommend anything that could feel controlling or intense." : "."}
2. Push-pull is ${profile.push_pull_tendency ?? "unknown"}${profile.push_pull_tendency === "high" ? " — do not overreact to distance. Recommend calm re-engagement, not pursuit." : "."}
3. Internal comm sensitivity is ${profile.comm_sensitivity_internal ?? profile.comm_sensitivity} — sudden changes in communication frequency carry real weight even if not expressed.
4. Gift sensitivity is ${profile.gift_sensitivity}${profile.gift_sensitivity === "low" ? " — do not recommend gifts unless small, natural, and context-specific." : "."}
5. Repair priority is ${repairRanking} — weight recommendations accordingly. Higher-ranked styles should be recommended first.
6. Best connection is ${profile.best_connection_format}${profile.best_connection_secondary ? ` / ${profile.best_connection_secondary}` : ""} — recommend these formats over intense emotional talks.
${profile.mbti ? `7. MBTI ${profile.mbti} — use lightly as a communication style hint. Do not over-diagnose.` : ""}`.trim();
}

function buildRecentHistoryContext(
  summaries: { summary: string; drift_level: string; created_at: string }[]
): string {
  if (summaries.length === 0) return "";
  const lines = summaries.map((s) => {
    const date = new Date(s.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `[${date}] ${s.drift_level}: ${s.summary}`;
  });
  return `\nRECENT SESSION HISTORY (use as context for patterns and trajectory):\n${lines.join("\n")}`;
}

const INITIAL_SYSTEM = `You are a relationship calibration assistant analyzing a situation to give an honest, proportionate recommendation. You have deep knowledge of attachment theory and communication dynamics, but you write like a sharp, self-aware operator — not a therapist.

Your job: assess what's happening, recommend the right action and message, flag what NOT to do, and ask one specific follow-up question to better understand the situation.

Return ONLY valid JSON, no markdown fences.

Output schema:
{
  "drift_level": "solid" | "light-drift" | "noticeable" | "friction",
  "drift_score": 0-100,
  "situation_summary": "2-3 sentences. What's actually happening here, stated plainly.",
  "emotional_dynamic": "1-2 sentences. What's likely going on for her beneath the surface.",
  "why": "concise 1-sentence signal summary",
  "signals": ["signal 1", "signal 2"],
  "say_light": "casual, warm — resumes presence without commentary",
  "say_direct": "accountable, names the situation without over-explaining",
  "say_warm": "emotionally present, owns it, points toward reconnection",
  "do": "specific action (1 sentence)",
  "action_intensity": "none"|"message"|"voice-note"|"coffee-walk"|"dinner"|"gesture"|"quality-time-block",
  "what_not_to_do": "1-2 sentences specific to this profile and situation",
  "guardrail": "overcorrection warning or null",
  "confidence": "low"|"medium"|"high",
  "profile_fit": "1 sentence on why this recommendation fits the behavioral profile",
  "follow_up_question": "One specific, non-leading question to better understand the situation. Conversational, not clinical."
}`;

const FOLLOWUP_SYSTEM = `You are a relationship calibration assistant continuing a conversation. The user has shared their perspective on your recommendation. Engage with it honestly — agree where they're right, push back where relevant, offer a reframe if useful. Then ask exactly one more follow-up question, or set follow_up_question to null if the conversation has naturally reached a conclusion.

Return ONLY valid JSON, no markdown fences.

Output schema:
{
  "perspective": "2-4 sentences. Engage with what they said. Be direct. Don't just validate.",
  "follow_up_question": "One more specific question, or null if complete."
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      input,
      profile,
      conversation_id,
      messages: priorMessages = [],
    }: {
      input: string;
      profile: PartnerProfile | null;
      conversation_id?: string;
      messages?: { role: "user" | "assistant"; content: string }[];
    } = body;

    if (!input?.trim()) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    const profileCtx = buildProfileContext(profile);
    const isInitial = !conversation_id;

    if (isInitial) {
      // Fetch recent conversation history for context
      const summaries = await fetchRecentConversationSummaries(4);
      const historyCtx = buildRecentHistoryContext(summaries);

      const systemPrompt = [INITIAL_SYSTEM, profileCtx, historyCtx]
        .filter(Boolean)
        .join("\n\n");

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Here's what's been going on:\n\n${input.trim()}`,
          },
        ],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const result: AnalysisResult = JSON.parse(text);

      // Persist conversation + messages
      const summary = result.situation_summary.slice(0, 200);
      const convId = await createConversation({
        profile_id: null,
        summary,
        drift_level: result.drift_level,
        drift_score: result.drift_score,
      });

      if (convId) {
        await appendMessage({
          conversation_id: convId,
          role: "user",
          content: input.trim(),
        });
        await appendMessage({
          conversation_id: convId,
          role: "assistant",
          content: JSON.stringify({ type: "analysis", data: result }),
        });
      }

      return NextResponse.json({ result, conversation_id: convId });
    } else {
      // Continuing conversation — follow-up mode
      const systemPrompt = [FOLLOWUP_SYSTEM, profileCtx].filter(Boolean).join("\n\n");

      // Build message history for Claude
      const claudeMessages: { role: "user" | "assistant"; content: string }[] = [
        ...priorMessages,
        { role: "user", content: input.trim() },
      ];

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: systemPrompt,
        messages: claudeMessages,
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const result: FollowUpResponse = JSON.parse(text);

      // Persist messages
      await appendMessage({
        conversation_id: conversation_id,
        role: "user",
        content: input.trim(),
      });
      await appendMessage({
        conversation_id: conversation_id,
        role: "assistant",
        content: JSON.stringify({ type: "followup", data: result }),
      });

      return NextResponse.json({ result, conversation_id });
    }
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

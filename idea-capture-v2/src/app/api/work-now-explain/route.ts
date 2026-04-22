import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const SYSTEM = `You are a sharp, operator-minded productivity coach.

Given a ClickUp task plus the user's current time-of-day context, produce:
1. A natural-language "why now" explanation — one tight paragraph (2-3 sentences). Blend urgency, importance, time-of-day fit, and strategic relevance. Do not restate raw scores. Sound intelligent and decisive, not generic.
2. A concrete execution plan: first step, next 2-5 steps, any blockers to check, and a suggested timebox.

Return JSON only, no markdown, no wrapping:
{
  "whyNow": "string — 2-3 sentences, natural language",
  "firstStep": "string — the very first concrete action",
  "nextSteps": ["string", "string", ...],    // 2-5 items
  "blockersToCheck": ["string", ...],         // 0-3 items
  "timebox": "string — e.g. '30–45 min', 'one 90-min focus block'"
}`;

export async function POST(req: NextRequest) {
  const { task, timeOfDay, timeOfDayLabel, preference, breakdown, latestComment } = await req.json();

  if (!task) {
    return NextResponse.json({ error: "task required" }, { status: 400 });
  }

  const apiKey = process.env.IDEA_CAPTURE_ANTHROPIC_KEY;
  if (!apiKey) {
    // Deterministic fallback so UI stays usable without LLM
    return NextResponse.json(fallback(task, timeOfDayLabel));
  }

  const anthropic = new Anthropic({ apiKey });

  const userPrompt = `Current time-of-day: ${timeOfDayLabel} (${timeOfDay})
User preference mode: ${preference || "balanced"}

Task:
- Name: ${task.name}
- List: ${task.listName || "n/a"}
- Status: ${task.status || "n/a"}
- Priority: ${task.priorityLabel || "none"}
- Due: ${task.dueDate || "no due date"}
- Estimated duration: ${task.durationMinutes ? `${task.durationMinutes} min` : "unknown"}
- Activation energy (inferred): ${task.activationEnergy || "medium"}
- Tags: ${(task.tags || []).join(", ") || "none"}
- Strategic: ${task.isStrategic ? "yes" : "no"}
- Possibly blocked: ${task.isBlocked ? "yes" : "no"}
- Description: ${task.description ? task.description.slice(0, 600) : "(none)"}
- Latest comment: ${latestComment ? latestComment.slice(0, 400) : "(none)"}

Score signals (0-1 scale, for context only — do not quote them):
${breakdown ? JSON.stringify(breakdown) : "n/a"}

Produce the JSON.`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: attempt < 2 ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001",
        max_tokens: 700,
        temperature: 0.35,
        system: SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = response.content.find((b) => b.type === "text");
      const content = block?.text?.trim();
      if (!content) throw new Error("Empty response");
      const cleaned = content
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        whyNow: parsed.whyNow || "",
        firstStep: parsed.firstStep || "",
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
        blockersToCheck: Array.isArray(parsed.blockersToCheck) ? parsed.blockersToCheck : [],
        timebox: parsed.timebox || "",
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown");
      const msg = lastError.message.toLowerCase();
      if (msg.includes("overloaded") || msg.includes("529") || msg.includes("rate") || msg.includes("500")) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  console.error("work-now-explain error:", lastError?.message);
  // Graceful fallback — UI stays usable
  return NextResponse.json(fallback(task, timeOfDayLabel));
}

function fallback(task: { name: string; activationEnergy?: string; durationMinutes?: number }, label?: string) {
  return {
    whyNow: `${task.name} scored highest on the blend of urgency, importance, and ${(label || "current time").toLowerCase()} fit.`,
    firstStep: `Open the ClickUp task and re-read the description so you start with full context.`,
    nextSteps: [
      "Break the task into the single next concrete deliverable you can finish in one sitting.",
      "Silence notifications and timebox the work.",
      "Produce a rough first pass — quantity over polish.",
      "Review, tighten, and either ship or note the next blocker.",
    ],
    blockersToCheck: ["Any dependencies or inputs you need from someone else?"],
    timebox: task.durationMinutes
      ? `${task.durationMinutes} min`
      : task.activationEnergy === "high"
      ? "one 60-90 min focus block"
      : task.activationEnergy === "low"
      ? "15-20 min"
      : "30-45 min",
  };
}

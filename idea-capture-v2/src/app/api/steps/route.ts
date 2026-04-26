import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 15;

const STEPS_PROMPT = `You are a productivity coach. Given a task, generate clear step-by-step instructions to complete it.

Rules:
- Be specific and actionable — each step should be something concrete you can do
- Keep steps concise (one sentence each)
- Include 3-7 steps depending on complexity
- If the task involves tools/apps, name them specifically
- Order steps logically — what comes first, what depends on what
- The first step should be the very first thing to do (open an app, pull up a doc, etc.)
- The last step should be verification or delivery

Return JSON only: { "steps": ["step 1", "step 2", ...] }
No markdown, no wrapping, no other text.`;

export async function POST(req: NextRequest) {
  const { task } = await req.json();

  const apiKey = process.env.IDEA_CAPTURE_ANTHROPIC_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key configured" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Task: ${task.taskName}
Destination: ${task.destination}
Duration: ${task.duration}
Urgency: ${task.urgency}
Importance: ${task.importance}
${task.dueDate ? `Due: ${task.dueDate}` : ""}
${task.how ? `First step hint: ${task.how}` : ""}
Raw input: ${task.rawInput}

Generate step-by-step instructions to complete this task.`;

  let lastError: Error | null = null;
  // Single attempt with Haiku — steps are simple and Haiku is much faster
  for (let attempt = 0; attempt < 1; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        temperature: 0.3,
        system: STEPS_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const content = textBlock?.text?.trim();
      if (!content) throw new Error("Empty response");

      const cleaned = content
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        steps: parsed.steps || [],
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown error");
      const msg = lastError.message.toLowerCase();
      if (
        msg.includes("overloaded") ||
        msg.includes("529") ||
        msg.includes("rate") ||
        msg.includes("500")
      ) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  const message = lastError?.message || "Failed to generate steps";
  console.error("steps error:", message);
  return NextResponse.json({ error: message }, { status: 502 });
}

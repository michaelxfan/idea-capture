import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { REASONING_PROMPT } from "@/lib/prompt";

export const maxDuration = 30;

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
Raw input: ${task.rawInput}

Explain the routing and suggest the first action step.`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: attempt < 2 ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001",
        max_tokens: 256,
        temperature: 0.3,
        system: REASONING_PROMPT,
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
        whyRouted: parsed.whyRouted || "",
        how: parsed.how || "",
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

  const message = lastError?.message || "Failed to generate reasoning";
  console.error("reasoning error:", message);
  return NextResponse.json({ error: message }, { status: 502 });
}

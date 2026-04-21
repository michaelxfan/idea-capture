import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a concise email drafting assistant.
Given a task with its details AND the original unstructured input the user typed, write a short, professional email that delegates or communicates this task.

IMPORTANT: The "Original input" contains the user's raw thinking — tone, context, nuance, and specifics that didn't fit into the structured fields. Use it to ground the email in the user's actual intent and voice. Don't just paraphrase the task name — pull concrete details from the original input where they add clarity.

The email should be direct and actionable.
Return ONLY the email text — no subject line label, no "Subject:" prefix, no markdown formatting.
Format as:
First line: the subject (just the text, no "Subject:" prefix)
Blank line
Body of the email

Keep it under 150 words. Be warm but efficient.`;

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

  const emailContextBlock = task.emailContext
    ? `

Attached source email (this is the message the task is reacting to — synthesize with user's instruction, and if drafting a reply, reply to this email's sender):
"""
${task.emailContext.subject ? `Subject: ${task.emailContext.subject}` : ""}
${task.emailContext.from ? `From: ${task.emailContext.from}` : ""}
${task.emailContext.to ? `To: ${task.emailContext.to}` : ""}
${task.emailContext.date ? `Date: ${task.emailContext.date}` : ""}

${task.emailContext.body}
"""`
    : "";

  const prompt = `Task: ${task.taskName}
Destination: ${task.destination}
Duration: ${task.duration}
Why routed here: ${task.whyRouted || "(not yet generated)"}
How (first step): ${task.how || "(not yet generated)"}
Urgency: ${task.urgency}
Importance: ${task.importance}
${task.dueDate ? `Due: ${task.dueDate}` : ""}

User's typed instruction (treat this as the instruction layer on top of any attached email):
"""
${task.rawInput}
"""${emailContextBlock}

Draft a short email for this task. Synthesize the user's instruction with the attached email context (if any). Pull concrete details from both sources where they add clarity.`;

  // Retry up to 2 times on transient failures
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: attempt < 2 ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        temperature: 0.4,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const content = textBlock?.text?.trim();
      if (!content) {
        throw new Error("Empty response from AI");
      }

      return NextResponse.json({ draft: content });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown error");
      // Only retry on 5xx / overloaded / rate limit
      const msg = lastError.message.toLowerCase();
      if (msg.includes("rate") || msg.includes("overloaded") || msg.includes("529") || msg.includes("500")) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  const message = lastError?.message || "Failed to generate email";
  console.error("email-draft error:", message);
  return NextResponse.json({ error: message }, { status: 502 });
}

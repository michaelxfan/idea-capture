import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { generateMockTasks } from "@/lib/mock";
import { Task, EmailContext } from "@/lib/types";

export const maxDuration = 60;

function buildCombinedInput(input: string, emailContext?: EmailContext): string {
  if (!emailContext) return input;

  const header = [
    emailContext.subject ? `Subject: ${emailContext.subject}` : "",
    emailContext.from ? `From: ${emailContext.from}` : "",
    emailContext.to ? `To: ${emailContext.to}` : "",
    emailContext.cc ? `Cc: ${emailContext.cc}` : "",
    emailContext.date ? `Date: ${emailContext.date}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `The user has attached an email as CONTEXT (source material) and typed an INSTRUCTION on top of it. Synthesize both — the email is what the task is about; the typed instruction tells you what to do with it.

--- ATTACHED EMAIL (context) ---
${header}

${emailContext.body}
--- END EMAIL ---

--- USER INSTRUCTION (how to act on the email) ---
${input || "(no typed instruction — infer the appropriate task from the email alone)"}
--- END INSTRUCTION ---`;
}

export async function POST(req: NextRequest) {
  const { input, emailContext } = await req.json();

  const hasInput = typeof input === "string" && input.trim().length > 0;
  const hasEmail = emailContext && typeof emailContext === "object" && emailContext.body;

  if (!hasInput && !hasEmail) {
    return NextResponse.json(
      { error: "Input or email context is required" },
      { status: 400 }
    );
  }

  const combined = buildCombinedInput(hasInput ? input.trim() : "", hasEmail ? emailContext : undefined);

  const apiKey = process.env.IDEA_CAPTURE_ANTHROPIC_KEY;

  // Fallback to mock mode if no API key
  if (!apiKey) {
    console.log("No IDEA_CAPTURE_ANTHROPIC_KEY found — using mock mode");
    const tasks = generateMockTasks(hasInput ? input.trim() : emailContext?.subject || "Email task");
    return NextResponse.json({ tasks, mock: true });
  }

  const anthropic = new Anthropic({ apiKey });

  // Retry up to 3 times on transient failures (overloaded, rate limit)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: attempt < 2 ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: combined },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const content = textBlock?.text;
      if (!content) {
        throw new Error("Empty response from Claude");
      }

      // Strip markdown code fences if Claude wraps the JSON
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);

      // Handle single object, or array/wrapped — always take the first task
      let task: Task;
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) throw new Error("Claude returned an empty array");
        task = parsed[0];
      } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
        if (parsed.tasks.length === 0) throw new Error("Claude returned an empty tasks array");
        task = parsed.tasks[0];
      } else {
        task = parsed;
      }

      if (!task || !task.taskName) {
        throw new Error("Claude did not return a valid task");
      }

      // Stamp with a unique ID and createdAt
      const now = new Date().toISOString();
      const stamped = {
        ...task,
        id: `task-${Date.now()}-0-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
      };

      return NextResponse.json({ tasks: [stamped], mock: false });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown error");
      const msg = lastError.message.toLowerCase();
      if (msg.includes("overloaded") || msg.includes("529") || msg.includes("rate") || msg.includes("500")) {
        console.log(`Attempt ${attempt + 1} failed (${msg}), retrying...`);
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  console.error("LLM interpretation error after retries:", lastError?.message);
  const message = lastError?.message || "LLM call failed";
  return NextResponse.json(
    { error: message, tasks: [], mock: false },
    { status: 502 }
  );
}

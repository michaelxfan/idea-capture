import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { generateMockTasks } from "@/lib/mock";
import { Task } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return NextResponse.json(
      { error: "Input is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.IDEA_CAPTURE_ANTHROPIC_KEY;

  // Fallback to mock mode if no API key
  if (!apiKey) {
    console.log("No IDEA_CAPTURE_ANTHROPIC_KEY found — using mock mode");
    const tasks = generateMockTasks(input.trim());
    return NextResponse.json({ tasks, mock: true });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: input.trim() },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock?.text;
    if (!content) {
      throw new Error("Empty response from Claude");
    }

    const parsed = JSON.parse(content);

    // Handle both { tasks: [...] } and [...] formats
    const tasks: Task[] = Array.isArray(parsed) ? parsed : parsed.tasks;

    if (!Array.isArray(tasks)) {
      throw new Error("Claude did not return an array of tasks");
    }

    return NextResponse.json({ tasks, mock: false });
  } catch (err) {
    console.error("LLM interpretation error:", err);
    // Fall back to mock on error
    const tasks = generateMockTasks(input.trim());
    return NextResponse.json({ tasks, mock: true, error: "LLM call failed, showing mock results" });
  }
}

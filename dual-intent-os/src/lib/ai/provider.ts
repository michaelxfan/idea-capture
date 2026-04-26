import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { interpretationSchema, type CaptureInput, type Interpretation } from "./schema";
import { mockInterpret } from "./mock";

/**
 * Modular AI interpretation layer.
 * Swap providers by replacing the body of interpretCapture.
 * Falls back to deterministic mock when no API key is configured.
 */

const MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";

function hasRealKey() {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && !k.includes("placeholder");
}

let _client: Anthropic | null = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : trimmed;
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("AI response did not contain a JSON object");
  return JSON.parse(raw.slice(first, last + 1));
}

const THRESHOLD_ENUM = new Set([
  "time",
  "energy",
  "ambiguity",
  "emotional_discomfort",
  "social_risk",
  "uncertainty",
  "friction",
  "mixed",
  "unclear",
]);
const B_CLASS_ENUM = new Set([
  "strategic",
  "protective",
  "avoidant",
  "healthy",
  "mixed",
  "unclear",
]);

/** Normalize enums before Zod: models improvise and we'd rather coerce than 500. */
function normalizeInterpretation(obj: any) {
  if (!obj || typeof obj !== "object") return obj;

  // current_mode: normalize to 'A' | 'B' | 'mixed' | 'unclear'
  if (typeof obj.current_mode === "string") {
    const m = obj.current_mode.trim().toLowerCase();
    if (m === "a") obj.current_mode = "A";
    else if (m === "b") obj.current_mode = "B";
    else if (m === "mixed" || m === "unclear") obj.current_mode = m;
    else obj.current_mode = "unclear";
  }

  // threshold_type: coerce to known enum, collapse unknowns to 'mixed'
  if (typeof obj.threshold_type === "string") {
    const t = obj.threshold_type.trim().toLowerCase().replace(/[\s-]/g, "_");
    obj.threshold_type = THRESHOLD_ENUM.has(t) ? t : "mixed";
  }

  // b_classification: coerce to known enum, unknowns to 'mixed'
  if (typeof obj.b_classification === "string") {
    const c = obj.b_classification.trim().toLowerCase();
    obj.b_classification = B_CLASS_ENUM.has(c) ? c : "mixed";
  }

  return obj;
}

export async function interpretCapture(input: CaptureInput): Promise<Interpretation> {
  if (!hasRealKey()) return mockInterpret(input);

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlock = msg.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("AI response missing text");
  const parsed = normalizeInterpretation(extractJson(textBlock.text));
  return interpretationSchema.parse(parsed);
}

import Anthropic from "@anthropic-ai/sdk";

export type ClaudeImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export type ClaudeContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: ClaudeImageMediaType; data: string } };

const PRIMARY = "claude-sonnet-4-20250514";
const FALLBACK = "claude-haiku-4-5-20251001";

export function hasAnthropicKey() {
  return Boolean(process.env.INFLUENCE_COACH_ANTHROPIC_KEY);
}

export function getClient(): Anthropic | null {
  const apiKey = process.env.INFLUENCE_COACH_ANTHROPIC_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

interface CallOpts {
  system: string;
  user: string | ClaudeContentBlock[];
  maxTokens?: number;
  temperature?: number;
}

export async function callClaudeText(opts: CallOpts): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("Anthropic not configured");

  const content: ClaudeContentBlock[] =
    typeof opts.user === "string" ? [{ type: "text", text: opts.user }] : opts.user;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: attempt < 2 ? PRIMARY : FALLBACK,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.4,
        system: opts.system,
        messages: [{ role: "user", content }],
      });
      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text" || !text.text) {
        throw new Error("Empty Claude response");
      }
      return text.text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();
      if (msg.includes("overloaded") || msg.includes("529") || msg.includes("rate") || msg.includes("500")) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      break;
    }
  }
  throw lastError ?? new Error("Claude call failed");
}

export async function callClaudeJson<T = unknown>(opts: CallOpts): Promise<T> {
  const raw = await callClaudeText(opts);
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}$/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Claude did not return valid JSON: ${cleaned.slice(0, 200)}`);
  }
}

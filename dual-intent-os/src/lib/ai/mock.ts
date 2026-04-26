import type { CaptureInput } from "./schema";
import type { Interpretation } from "./schema";

/**
 * Deterministic mock interpreter for demo/dev use without an API key.
 * Heuristic: pulls clues from the situation text and structured fields.
 */
export function mockInterpret(input: CaptureInput): Interpretation {
  const text = input.situation_text.toLowerCase();

  const has = (...needles: string[]) => needles.some((n) => text.includes(n));

  let threshold_type: Interpretation["threshold_type"] = "mixed";
  if (has("tired", "exhausted", "drained", "low energy")) threshold_type = "energy";
  else if (has("uncomfortable", "awkward", "difficult", "confront")) threshold_type = "emotional_discomfort";
  else if (has("don't know", "unclear", "not sure", "ambiguous")) threshold_type = "ambiguity";
  else if (has("judge", "look bad", "embarrass")) threshold_type = "social_risk";
  else if (has("time", "deadline", "quickly", "fast")) threshold_type = "time";
  else if (has("friction", "hassle", "annoying")) threshold_type = "friction";

  const avoidantSignals = has("just want", "make it go away", "easier", "disappear", "proof that");
  const tiredSignals = has("tired", "exhausted");
  const b_classification: Interpretation["b_classification"] = avoidantSignals
    ? "avoidant"
    : tiredSignals
    ? "protective"
    : "mixed";

  const current_mode: Interpretation["current_mode"] = avoidantSignals ? "B" : "mixed";

  const firstSentence = input.situation_text.split(/[.!?]/)[0].trim();

  return {
    a_intention: `What you said you wanted: ${firstSentence.slice(0, 140)}.`,
    b_intention: avoidantSignals
      ? "Take the lowest-friction path that still lets you feel you did the thing."
      : "Preserve energy and avoid the costlier version of the task.",
    threshold_type,
    threshold_description:
      threshold_type === "energy"
        ? "Switch happens when remaining energy drops below what the ideal version would cost."
        : threshold_type === "emotional_discomfort"
        ? "Switch happens when the next step requires an emotional decision, not just a factual one."
        : threshold_type === "ambiguity"
        ? "Switch happens when the ideal path feels ambiguous and the fallback feels defined."
        : "Switch happens when the cost of A exceeds your current tolerance in a specific, nameable way.",
    current_mode,
    evidence:
      "Heuristic read of your own phrasing — words like " +
      (avoidantSignals ? "'just want', 'easier', or 'disappear' " : "the framing you used ") +
      "signal where the real pull is. (Mock mode — add ANTHROPIC_API_KEY for the real interpreter.)",
    b_classification,
    recommendation:
      "Commit to a 15-minute version of A. Set a timer. Stop at 15 whether or not you're done.",
    minimum_viable_a:
      "The smallest version of A that still counts as A to you — not the version that only counts to an observer.",
  };
}

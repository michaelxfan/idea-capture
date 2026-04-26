/**
 * Seed demo captures for a given user.
 *
 * Usage:
 *   DEMO_USER_ID=<uuid> tsx scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const userId = process.env.DEMO_USER_ID;

if (!url || !key || !userId) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DEMO_USER_ID.");
  process.exit(1);
}

const supabase = createClient(url, key);

const demo = [
  {
    situation_text:
      "I need to reply to a difficult work email. I say I want to be clear and thoughtful, but honestly I mainly want to make it disappear.",
    domain: "work",
    energy_level: "medium",
    emotional_tone: "resistant",
    stakes: "medium",
    a_intention: "Send a clear, thoughtful reply that resolves the underlying issue.",
    b_intention: "Make the email disappear from the inbox with the minimum emotional cost.",
    threshold_type: "emotional_discomfort",
    threshold_description:
      "Switch happens when the email requires an emotional decision, not just a factual one.",
    current_mode: "B",
    evidence:
      "The user explicitly names 'make it disappear' as the real pull, and hedges on 'honestly' — already drifting.",
    b_classification: "avoidant",
    recommendation:
      "Draft three sentences: the fact, the decision, the next step. Send. Do not polish past that.",
    minimum_viable_a: "Write the three-sentence version of the thoughtful reply you'd send on a good day.",
  },
  {
    situation_text:
      "I planned to do a high-quality workout, but I'm tired and really just want proof that I stayed disciplined.",
    domain: "health",
    energy_level: "low",
    emotional_tone: "tired",
    stakes: "low",
    a_intention: "Complete a genuinely hard, high-quality workout.",
    b_intention: "Do just enough to count as 'stayed disciplined' and preserve the streak.",
    threshold_type: "energy",
    threshold_description:
      "Switch when fatigue makes the full session feel like a chore rather than a challenge.",
    current_mode: "mixed",
    evidence: "'Really just want proof' signals the fallback is already leading.",
    b_classification: "strategic",
    recommendation:
      "Do a 20-minute version at real intensity. Streak intact, body gets a real stimulus.",
    minimum_viable_a: "Short, honest-intensity session. Stop when form breaks.",
  },
  {
    situation_text:
      "I want to go to dinner with friends to connect, but after a long day it feels more like obligation.",
    domain: "social",
    energy_level: "low",
    emotional_tone: "tired",
    stakes: "medium",
    a_intention: "Show up fully and have a real conversation with people I care about.",
    b_intention: "Physically attend so no one feels ignored, and leave early.",
    threshold_type: "energy",
    threshold_description:
      "Switch when social energy required exceeds remaining social energy in the tank.",
    current_mode: "B",
    evidence: "'Obligation' is the frame — connection already priced out.",
    b_classification: "protective",
    recommendation:
      "Go for 90 minutes. Tell one friend honestly you're flat tonight — lowers performance pressure.",
    minimum_viable_a: "One real question asked of one person. That counts.",
  },
  {
    situation_text:
      "I want to work on strategy, but I keep clearing small tasks because it feels easier and more controllable.",
    domain: "work",
    energy_level: "medium",
    emotional_tone: "anxious",
    stakes: "high",
    a_intention: "Make real progress on the one strategic question that matters this week.",
    b_intention: "Clear tactical tasks and feel the dopamine of a shrinking list.",
    threshold_type: "ambiguity",
    threshold_description:
      "Switch when the strategic work feels ambiguous and the tactical work feels defined.",
    current_mode: "B",
    evidence: "'Easier and more controllable' names the exact pull of B over A.",
    b_classification: "avoidant",
    recommendation:
      "Close email. Write the strategic question as a single sentence. Spend 25 minutes answering it badly.",
    minimum_viable_a: "One paragraph of bad strategic writing. Quality comes on pass two.",
  },
];

async function main() {
  const rows = demo.map((d) => ({
    user_id: userId,
    ai_status: "ready" as const,
    ...d,
  }));
  const { error, data } = await supabase.from("captures").insert(rows).select();
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Seeded ${data?.length ?? 0} captures for ${userId}.`);
}

main();

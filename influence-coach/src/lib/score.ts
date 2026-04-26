import type { Stakeholder, StakeholderGoals, RelationshipStrength } from "./types";

const RELATIONSHIP_WEIGHT: Record<RelationshipStrength, number> = {
  cold: 0.6,
  neutral: 0.9,
  aligned: 1.15,
  sponsor: 1.35,
};

export function priorityScore(s: Stakeholder, g?: StakeholderGoals): number {
  const influence = s.influenceScore;
  const goalP = g?.priorityLevel ?? 0;
  if (goalP === 0 && !g?.goal1m && !g?.goal3m && !g?.goal12m) return influence * 1.0;
  const relWeight = RELATIONSHIP_WEIGHT[s.relationshipStrength];
  const blockerBoost = g?.blockers && g.blockers.trim().length > 0 ? 1.2 : 1;
  const statusBoost = g?.status === "blocked" ? 1.3 : 1;
  return Math.round(influence * (goalP || 3) * relWeight * blockerBoost * statusBoost * 10) / 10;
}

/**
 * Leverage score = priority × downstream multiplier.
 * downstream = number of stakeholders influenced by s that have blocked/active goals.
 * Influencing a well-connected person cascades to unblock more asks.
 */
export function leverageScore(
  s: Stakeholder,
  g: StakeholderGoals | undefined,
  allWithGoals: { s: Stakeholder; g?: StakeholderGoals }[]
): number {
  const base = priorityScore(s, g);
  const downstreamBlocked = s.influences.filter((id) => {
    const downstream = allWithGoals.find((x) => x.s.id === id);
    return downstream && (downstream.g?.status === "blocked" || downstream.g?.status === "in_progress");
  }).length;
  const multiplier = 1 + downstreamBlocked * 0.5;
  return Math.round(base * multiplier * 10) / 10;
}

/** Days until decision deadline, or null if not set */
export function daysUntilDeadline(g?: StakeholderGoals): number | null {
  if (!g?.decisionDeadline) return null;
  const diff = new Date(g.decisionDeadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Color class for deadline urgency */
export function deadlineUrgencyClass(days: number | null): string {
  if (days === null) return "";
  if (days <= 7) return "text-[var(--danger)]";
  if (days <= 30) return "text-amber-600";
  return "text-[var(--text-tertiary)]";
}

export function relationshipLabel(r: RelationshipStrength) {
  switch (r) {
    case "cold": return "Cold";
    case "neutral": return "Neutral";
    case "aligned": return "Aligned";
    case "sponsor": return "Sponsor";
  }
}

export function relationshipChipClass(r: RelationshipStrength) {
  switch (r) {
    case "cold": return "chip-danger";
    case "neutral": return "chip";
    case "aligned": return "chip-brand";
    case "sponsor": return "chip-ok";
  }
}

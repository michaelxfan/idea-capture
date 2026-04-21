import { Task } from "./types";

const LEVEL_VALUES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Calculate a priority score from 0-100 based on:
 * - Importance (35% weight)
 * - Urgency (30% weight)
 * - Activation Energy (15% weight, inverted — low energy = higher score)
 * - Due Date proximity (20% weight — closer deadline = higher score)
 */
export function calcScore(task: Task): number {
  const imp = LEVEL_VALUES[task.importance] || 2;
  const urg = LEVEL_VALUES[task.urgency] || 2;
  // Invert activation energy: low=3, medium=2, high=1
  const ae = 4 - (LEVEL_VALUES[task.activationEnergy] || 2);

  // Due date factor: 1 (no date) to 3 (overdue/today)
  let dd = 1;
  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    const daysUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 0) dd = 3;        // overdue or today
    else if (daysUntil <= 2) dd = 2.5;  // within 2 days
    else if (daysUntil <= 7) dd = 2;    // within a week
    else if (daysUntil <= 14) dd = 1.5; // within 2 weeks
    else dd = 1;                         // far out
  }

  const raw = imp * 0.35 + urg * 0.3 + ae * 0.15 + dd * 0.2;
  // raw ranges from 1.0 to 3.0
  const normalized = Math.round(((raw - 1) / 2) * 100);
  return Math.max(0, Math.min(100, normalized));
}

export function scoreColor(score: number): { bg: string; color: string } {
  if (score >= 70) return { bg: "var(--high-bg)", color: "var(--high-text)" };
  if (score >= 40) return { bg: "var(--medium-bg)", color: "var(--medium-text)" };
  return { bg: "var(--low-bg)", color: "var(--low-text)" };
}

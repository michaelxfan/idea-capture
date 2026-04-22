/**
 * Work Now — time-aware task recommendation engine.
 *
 * Pure logic. No network. Takes normalized ClickUp tasks + current local time,
 * returns a ranked list with per-task score breakdowns and a natural-language
 * reason for the top pick.
 */

export type TimeOfDay =
  | "early-morning"
  | "late-morning"
  | "early-afternoon"
  | "late-afternoon"
  | "evening"
  | "night";

export type EnergyLevel = "low" | "medium" | "high";

/** Normalized task shape — fields we care about, independent of ClickUp's raw API. */
export interface NormalizedTask {
  id: string;
  name: string;
  url?: string;
  listName?: string;
  assignees: string[];
  status?: string;
  statusType?: string; // open, closed, custom
  priority?: number | null; // 1=urgent, 2=high, 3=normal, 4=low
  priorityLabel?: string;
  dueDate?: string | null; // ISO
  startDate?: string | null;
  dateCreated?: string | null;
  timeEstimate?: number | null; // ms
  tags: string[];
  description?: string;
  // Inferred fields
  activationEnergy?: EnergyLevel; // inferred from title/desc
  durationMinutes?: number | null; // inferred from timeEstimate or text
  isBlocked?: boolean;
  isStrategic?: boolean;
}

export interface ScoreBreakdown {
  urgency: number;
  importance: number;
  dueDateProximity: number;
  timeOfDayFit: number;
  activationEnergyFit: number;
  durationFit: number;
  readiness: number;
  strategicFit: number;
  total: number;
}

export interface ScoredTask {
  task: NormalizedTask;
  score: number;
  breakdown: ScoreBreakdown;
  shortReason: string;
}

export interface BatchSuggestion {
  tasks: NormalizedTask[];
  totalMinutes: number | null;
}

export interface RecommendationResult {
  timeOfDay: TimeOfDay;
  timeOfDayLabel: string;
  top: ScoredTask | null;
  backups: ScoredTask[];
  all: ScoredTask[];
  explanation: string; // deterministic template; LLM may replace it
  batchSuggestion?: BatchSuggestion;
}

export type Preference = "balanced" | "strategic" | "quick-wins";

/* ───────── Time-of-day classification ───────── */

export function classifyTimeOfDay(d: Date = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 9) return "early-morning";
  if (h >= 9 && h < 12) return "late-morning";
  if (h >= 12 && h < 15) return "early-afternoon";
  if (h >= 15 && h < 18) return "late-afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "night";
}

export function timeOfDayLabel(t: TimeOfDay): string {
  switch (t) {
    case "early-morning":
      return "Morning Focus";
    case "late-morning":
      return "Priority Execution";
    case "early-afternoon":
      return "Afternoon Admin";
    case "late-afternoon":
      return "Quick Wins";
    case "evening":
      return "Evening Wind-Down";
    case "night":
      return "Night";
  }
}

/**
 * For a given time-of-day, returns how well a task's activation energy fits.
 * Returns 0..1.
 */
function energyFit(t: TimeOfDay, energy: EnergyLevel | undefined): number {
  if (!energy) return 0.5;
  const fit: Record<TimeOfDay, Record<EnergyLevel, number>> = {
    "early-morning": { high: 1.0, medium: 0.55, low: 0.25 },
    "late-morning": { high: 0.85, medium: 0.75, low: 0.4 },
    "early-afternoon": { high: 0.45, medium: 0.85, low: 0.65 },
    "late-afternoon": { high: 0.3, medium: 0.7, low: 0.95 },
    evening: { high: 0.15, medium: 0.55, low: 0.95 },
    night: { high: 0.1, medium: 0.4, low: 0.9 },
  };
  return fit[t][energy];
}

/* ───────── Inference helpers ───────── */

const STRATEGIC_KEYWORDS = [
  "strategy", "strategic", "plan", "roadmap", "vision", "framework",
  "architecture", "design", "decision", "negotiate", "pitch", "hire",
  "fundraise", "review", "evaluate", "thesis", "okrs", "q1", "q2", "q3", "q4",
];

const QUICK_KEYWORDS = [
  "reply", "respond", "email", "follow up", "followup", "ping", "send",
  "forward", "schedule", "book", "confirm", "approve", "quick", "review pr",
  "merge", "close ticket", "update status",
];

const HIGH_ENERGY_KEYWORDS = [
  "write", "draft", "design", "build", "deep", "analysis", "research",
  "architect", "plan", "strategy", "outline", "pitch deck", "presentation",
];

const LOW_ENERGY_KEYWORDS = [
  "reply", "respond", "ping", "send", "forward", "organize", "file",
  "rename", "move", "tag", "archive", "review", "read", "clean up",
  "capture",
];

const BLOCKED_KEYWORDS = [
  "blocked", "waiting on", "waiting for", "pending approval", "need input",
  "blocker",
];

export function inferActivationEnergy(
  task: Pick<NormalizedTask, "name" | "description" | "tags" | "timeEstimate">
): EnergyLevel {
  const hay = [
    task.name,
    task.description || "",
    (task.tags || []).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const k of HIGH_ENERGY_KEYWORDS) if (hay.includes(k)) score += 1;
  for (const k of LOW_ENERGY_KEYWORDS) if (hay.includes(k)) score -= 1;

  // long estimated duration -> higher activation energy
  if (task.timeEstimate && task.timeEstimate > 60 * 60 * 1000) score += 1;
  if (task.timeEstimate && task.timeEstimate < 20 * 60 * 1000) score -= 1;

  if (score >= 2) return "high";
  if (score <= -1) return "low";
  return "medium";
}

export function inferDurationMinutes(
  task: Pick<NormalizedTask, "name" | "description" | "timeEstimate">
): number | null {
  if (task.timeEstimate && task.timeEstimate > 0) {
    return Math.round(task.timeEstimate / 60000);
  }
  const hay = `${task.name} ${task.description || ""}`.toLowerCase();
  const m = hay.match(/(\d{1,3})\s*(min|m|hr|h|hour|hours)\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    if (unit.startsWith("h")) return n * 60;
    return n;
  }
  return null;
}

export function inferIsStrategic(
  task: Pick<NormalizedTask, "name" | "description" | "tags">
): boolean {
  const hay = [
    task.name,
    task.description || "",
    (task.tags || []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return STRATEGIC_KEYWORDS.some((k) => hay.includes(k));
}

export function inferIsBlocked(
  task: Pick<NormalizedTask, "name" | "description" | "tags">
): boolean {
  const hay = [
    task.name,
    task.description || "",
    (task.tags || []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return BLOCKED_KEYWORDS.some((k) => hay.includes(k));
}

/* ───────── Scoring ───────── */

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function urgencyScore(t: NormalizedTask): number {
  // Priority: 1=urgent, 2=high, 3=normal, 4=low
  if (t.priority) {
    switch (t.priority) {
      case 1:
        return 1.0;
      case 2:
        return 0.8;
      case 3:
        return 0.5;
      case 4:
        return 0.25;
    }
  }
  const hay = `${t.name} ${t.description || ""} ${(t.tags || []).join(" ")}`.toLowerCase();
  if (/\burgent|asap|today|now\b/.test(hay)) return 0.9;
  if (/\bsoon|this week\b/.test(hay)) return 0.65;
  return 0.5;
}

function importanceScore(t: NormalizedTask): number {
  // Use priority as primary proxy, boost if strategic keywords present.
  const base = t.priority === 1 ? 0.95 : t.priority === 2 ? 0.75 : t.priority === 3 ? 0.55 : t.priority === 4 ? 0.3 : 0.55;
  return clamp01(base + (t.isStrategic ? 0.1 : 0));
}

function dueDateProximityScore(t: NormalizedTask, now: Date): number {
  if (!t.dueDate) return 0.4; // unknown — modest default
  const due = new Date(t.dueDate).getTime();
  if (Number.isNaN(due)) return 0.4;
  const diffDays = (due - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < -1) return 1.0; // overdue
  if (diffDays < 0.5) return 0.95; // due today/past-due
  if (diffDays < 1.5) return 0.85; // tomorrow
  if (diffDays < 3.5) return 0.7;
  if (diffDays < 7.5) return 0.55;
  if (diffDays < 14.5) return 0.4;
  return 0.25;
}

function durationFitScore(t: NormalizedTask, tod: TimeOfDay): number {
  const minutes = t.durationMinutes;
  if (minutes == null) return 0.5;
  // Ideal duration windows per time-of-day
  const ideal: Record<TimeOfDay, [number, number]> = {
    "early-morning": [45, 120],
    "late-morning": [30, 90],
    "early-afternoon": [20, 75],
    "late-afternoon": [10, 45],
    evening: [5, 30],
    night: [5, 20],
  };
  const [lo, hi] = ideal[tod];
  if (minutes >= lo && minutes <= hi) return 1.0;
  // Penalize based on distance from window
  const dist = minutes < lo ? lo - minutes : minutes - hi;
  return clamp01(1 - dist / 90);
}

function readinessScore(t: NormalizedTask): number {
  if (t.isBlocked) return 0.15;
  if (t.statusType === "closed") return 0;
  const blockedStatus = t.status && /wait|block|hold|pending/i.test(t.status);
  if (blockedStatus) return 0.25;
  return 0.9;
}

function strategicFitScore(t: NormalizedTask): number {
  return t.isStrategic ? 0.8 : 0.4;
}

export function scoreTask(
  t: NormalizedTask,
  now: Date,
  tod: TimeOfDay,
  preference: Preference = "balanced"
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    urgency: urgencyScore(t),
    importance: importanceScore(t),
    dueDateProximity: dueDateProximityScore(t, now),
    timeOfDayFit: energyFit(tod, t.activationEnergy),
    activationEnergyFit: energyFit(tod, t.activationEnergy),
    durationFit: durationFitScore(t, tod),
    readiness: readinessScore(t),
    strategicFit: strategicFitScore(t),
    total: 0,
  };

  // Weights — "balanced". Shift for preference.
  let w = {
    urgency: 0.16,
    importance: 0.18,
    dueDateProximity: 0.14,
    timeOfDayFit: 0.14,
    activationEnergyFit: 0.1,
    durationFit: 0.08,
    readiness: 0.12,
    strategicFit: 0.08,
  };
  if (preference === "strategic") {
    w = { ...w, strategicFit: 0.18, importance: 0.2, urgency: 0.1, durationFit: 0.05 };
  } else if (preference === "quick-wins") {
    w = { ...w, urgency: 0.22, durationFit: 0.16, strategicFit: 0.03, importance: 0.12 };
  }

  const total =
    breakdown.urgency * w.urgency +
    breakdown.importance * w.importance +
    breakdown.dueDateProximity * w.dueDateProximity +
    breakdown.timeOfDayFit * w.timeOfDayFit +
    breakdown.activationEnergyFit * w.activationEnergyFit +
    breakdown.durationFit * w.durationFit +
    breakdown.readiness * w.readiness +
    breakdown.strategicFit * w.strategicFit;

  // Blocked tasks get severely deprioritized
  const penalty = t.isBlocked ? 0.4 : 1.0;
  breakdown.total = +(total * penalty).toFixed(4);
  return breakdown;
}

function shortReasonFor(t: NormalizedTask, b: ScoreBreakdown, tod: TimeOfDay): string {
  const bits: string[] = [];
  if (b.dueDateProximity >= 0.85) bits.push("due very soon");
  else if (b.dueDateProximity >= 0.7) bits.push("due within a few days");
  if (b.urgency >= 0.8) bits.push("high urgency");
  if (b.importance >= 0.8) bits.push("high importance");
  if (b.timeOfDayFit >= 0.85) bits.push(`fits ${timeOfDayLabel(tod).toLowerCase()}`);
  if (t.isStrategic) bits.push("strategic");
  if (t.isBlocked) bits.push("⚠ flagged as blocked");
  if (bits.length === 0) bits.push("solid middle-of-the-road fit");
  return bits.join(", ");
}

/* ───────── Normalization from ClickUp raw ───────── */

interface ClickUpRawTask {
  id: string;
  name: string;
  url?: string;
  status?: { status?: string; type?: string };
  priority?: { priority?: string; orderindex?: string | number } | null;
  due_date?: string | null;
  start_date?: string | null;
  date_created?: string | null;
  time_estimate?: number | null;
  assignees?: Array<{ id: number; username?: string; email?: string }>;
  tags?: Array<{ name: string }>;
  description?: string;
  list?: { name?: string };
}

const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export function normalizeClickUpTask(raw: ClickUpRawTask): NormalizedTask {
  const priorityLabel = raw.priority?.priority?.toLowerCase();
  const priority = priorityLabel ? PRIORITY_MAP[priorityLabel] ?? null : null;

  const base: NormalizedTask = {
    id: raw.id,
    name: raw.name,
    url: raw.url,
    listName: raw.list?.name,
    assignees: (raw.assignees || []).map((a) => a.username || a.email || `user-${a.id}`),
    status: raw.status?.status,
    statusType: raw.status?.type,
    priority,
    priorityLabel: raw.priority?.priority,
    dueDate: raw.due_date ? new Date(parseInt(raw.due_date, 10)).toISOString() : null,
    startDate: raw.start_date ? new Date(parseInt(raw.start_date, 10)).toISOString() : null,
    dateCreated: raw.date_created ? new Date(parseInt(raw.date_created, 10)).toISOString() : null,
    timeEstimate: raw.time_estimate || null,
    tags: (raw.tags || []).map((t) => t.name),
    description: raw.description || "",
  };

  base.activationEnergy = inferActivationEnergy(base);
  base.durationMinutes = inferDurationMinutes(base);
  base.isStrategic = inferIsStrategic(base);
  base.isBlocked = inferIsBlocked(base);
  return base;
}

/* ───────── Top-level recommend() ───────── */

export function recommend(
  tasks: NormalizedTask[],
  opts: {
    now?: Date;
    preference?: Preference;
    timeAvailable?: number | null; // minutes; null/undefined = no filter
    snoozedIds?: string[];         // task IDs to exclude this session
  } = {}
): RecommendationResult {
  const now = opts.now ?? new Date();
  const preference = opts.preference ?? "balanced";
  const tod = classifyTimeOfDay(now);

  // Filter out closed/completed and non-actionable statuses (external, blocked)
  const EXCLUDED_STATUSES = /^(external|blocked|cancelled|canceled|done|complete|completed)$/i;
  const snoozedSet = new Set(opts.snoozedIds ?? []);

  const active = tasks.filter(
    (t) =>
      t.statusType !== "closed" &&
      !(t.status && EXCLUDED_STATUSES.test(t.status.trim())) &&
      !snoozedSet.has(t.id)
  );

  // Time-available filter: only exclude tasks that have an explicit duration AND exceed the window
  const timeFiltered = opts.timeAvailable
    ? active.filter((t) => !t.durationMinutes || t.durationMinutes <= opts.timeAvailable!)
    : active;

  // Detect batch opportunity: 3+ low-activation tasks that are short
  const quickTasks = active.filter(
    (t) => t.activationEnergy === "low" && (!t.durationMinutes || t.durationMinutes <= 20)
  );
  let batchSuggestion: BatchSuggestion | undefined;
  if (quickTasks.length >= 3) {
    const batch = quickTasks.slice(0, 5);
    const withDuration = batch.filter((t) => t.durationMinutes != null);
    batchSuggestion = {
      tasks: batch,
      totalMinutes: withDuration.length > 0
        ? withDuration.reduce((s, t) => s + (t.durationMinutes ?? 0), 0)
        : null,
    };
  }

  const scored: ScoredTask[] = timeFiltered.map((task) => {
    const breakdown = scoreTask(task, now, tod, preference);
    return {
      task,
      score: breakdown.total,
      breakdown,
      shortReason: shortReasonFor(task, breakdown, tod),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored[0] || null;
  const backups = scored.slice(1, 5);

  const explanation = top
    ? buildExplanation(top, tod, preference)
    : "No active tasks found for this assignee.";

  return {
    timeOfDay: tod,
    timeOfDayLabel: timeOfDayLabel(tod),
    top,
    backups,
    all: scored,
    explanation,
    batchSuggestion,
  };
}

function buildExplanation(
  s: ScoredTask,
  tod: TimeOfDay,
  preference: Preference
): string {
  const { task, breakdown: b } = s;
  const parts: string[] = [];

  const todLabel = timeOfDayLabel(tod).toLowerCase();
  const modeSuffix =
    preference === "strategic"
      ? " and you're in strategic mode"
      : preference === "quick-wins"
      ? " and you're leaning toward quick wins"
      : "";

  if (b.dueDateProximity >= 0.9) {
    parts.push(`It's due very soon${modeSuffix}`);
  } else if (b.dueDateProximity >= 0.7) {
    parts.push(`It's due within a few days${modeSuffix}`);
  } else if (b.urgency >= 0.8) {
    parts.push(`It carries high urgency${modeSuffix}`);
  } else if (task.isStrategic && preference === "strategic") {
    parts.push(`It's a strategic piece and you're in ${todLabel}`);
  } else {
    parts.push(`It scores highest on the blend of urgency, importance, and ${todLabel} fit`);
  }

  if (b.timeOfDayFit >= 0.85) {
    parts.push(
      `and its ${task.activationEnergy ?? "medium"}-activation profile matches ${todLabel} well`
    );
  }

  if (b.importance >= 0.8) {
    parts.push("it also scores high on importance");
  }

  if (task.isBlocked) {
    parts.push("— note: it's flagged as possibly blocked, so confirm dependencies before diving in");
  }

  return parts.join(", ") + ".";
}

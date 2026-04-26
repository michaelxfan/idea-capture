import type {
  Capture,
  DayType,
  ModeClassification,
  ThresholdType,
  TimeOfDayBucket,
  WhoopData,
} from "@/types";

// ---------- Derivation helpers ---------------------------------------------

export function timeOfDayBucket(iso: string): TimeOfDayBucket {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 14) return "midday";
  if (h >= 14 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

/**
 * Classify a single capture into one of the four operating modes.
 * Derives from existing interpretation fields — pure function, no state.
 */
export function classifyCaptureMode(c: Capture): ModeClassification {
  const b = c.b_classification;
  const mode = c.current_mode;

  if (b === "avoidant" && (mode === "B" || mode === "mixed")) return "Escape";
  if (b === "healthy" || b === "protective") return "Recover";
  if (mode === "A") return "Advance";
  return "Stabilize";
}

export function wasCorrectMode(c: Capture, dayType: DayType): boolean | null {
  const mc = c.mode_classification ?? classifyCaptureMode(c);
  if (mc === "Escape") return false;
  if (dayType === "advance_dominant") return mc === "Advance" || mc === "Stabilize";
  if (dayType === "stabilize_dominant") return mc === "Stabilize" || mc === "Recover";
  if (dayType === "recovery_dominant") return mc === "Recover" || mc === "Stabilize";
  return null;
}

export function thresholdTriggered(c: Capture): boolean {
  return c.current_mode === "B" || c.current_mode === "mixed";
}

// ---------- 1. Day classification ------------------------------------------

export type FocusLevel = "High" | "Medium" | "Low";

const WEEKDAY_FOCUS: Record<string, FocusLevel> = {
  Monday: "High",
  Tuesday: "High",
  Wednesday: "High",
  Thursday: "Medium",
  Friday: "Medium",
  Saturday: "Low",
  Sunday: "Medium",
};

export interface DayContext {
  dayOfWeek: string;
  focusLevel: FocusLevel;
  timeOfDay: TimeOfDayBucket;
}

export function getDayContext(): DayContext {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const dayOfWeek = DAYS[now.getDay()];
  const focusLevel = WEEKDAY_FOCUS[dayOfWeek] ?? "Medium";
  const timeOfDay = timeOfDayBucket(now.toISOString());
  return { dayOfWeek, focusLevel, timeOfDay };
}

export interface DayClassification {
  day_type: DayType;
  confidence: number; // 0..1
  reasoning: string;
}

export function classifyDay(
  captures: Capture[],
  whoop?: WhoopData | null,
  dayContext?: DayContext | null
): DayClassification {
  const reasons: string[] = [];

  if (captures.length === 0) {
    // Use WHOOP + day context to infer mode before any captures
    if (whoop) {
      const rec = whoop.recovery_pct ?? 100;
      const sleep = whoop.sleep_hours ?? 8;
      if (rec < 33 || sleep < 5) {
        return {
          day_type: "recovery_dominant",
          confidence: 0.82,
          reasoning: `WHOOP: recovery ${rec}%, sleep ${sleep}h — body needs recovery, not output.`,
        };
      }
      if (rec < 60 || sleep < 6) {
        return {
          day_type: "stabilize_dominant",
          confidence: 0.75,
          reasoning: `WHOOP: recovery ${rec}%, sleep ${sleep}h — below baseline. Structure over ambition today.`,
        };
      }
    }

    if (dayContext) {
      const { dayOfWeek, focusLevel, timeOfDay } = dayContext;
      if (focusLevel === "Low") {
        return {
          day_type: "stabilize_dominant",
          confidence: 0.6,
          reasoning: `${dayOfWeek} is a low-focus day. Use it for recovery, light execution, and input.`,
        };
      }
      if (focusLevel === "High" && (timeOfDay === "morning" || timeOfDay === "midday")) {
        const recoveryOk = !whoop || (whoop.recovery_pct ?? 100) >= 67;
        if (recoveryOk) {
          return {
            day_type: "advance_dominant",
            confidence: 0.6,
            reasoning: `${dayOfWeek} morning — high-focus window. Conditions favor Advance work.`,
          };
        }
      }
      if (timeOfDay === "afternoon") {
        return {
          day_type: "stabilize_dominant",
          confidence: 0.5,
          reasoning: `${dayOfWeek} afternoon — energy dip window. Structure over push.`,
        };
      }
    }

    return {
      day_type: "mixed",
      confidence: 0,
      reasoning: "No captures yet today.",
    };
  }

  const modes = captures.map((c) => c.mode_classification ?? classifyCaptureMode(c));
  const count = (m: ModeClassification) => modes.filter((x) => x === m).length;

  const counts = {
    Advance: count("Advance"),
    Stabilize: count("Stabilize"),
    Recover: count("Recover"),
    Escape: count("Escape"),
  };

  const total = captures.length;

  // Biological pressure from Whoop overrides weak capture signals.
  let bias: DayType | null = null;
  if (whoop) {
    if ((whoop.sleep_hours ?? 8) < 6 || (whoop.recovery_pct ?? 100) < 60) {
      bias = "stabilize_dominant";
      reasons.push(
        `Low sleep (${whoop.sleep_hours ?? "?"}h) or recovery (${whoop.recovery_pct ?? "?"}%) pushes toward stabilize.`
      );
    }
    if ((whoop.nap_count ?? 0) >= 2) {
      bias = "recovery_dominant";
      reasons.push(`Multiple naps (${whoop.nap_count}) signals recovery day.`);
    }
  }

  // Dominant from captures.
  const entries = Object.entries(counts) as [ModeClassification, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [topMode, topCount] = entries[0];
  const share = topCount / total;

  let day_type: DayType;
  if (bias) {
    day_type = bias;
  } else if (share < 0.5) {
    day_type = "mixed";
  } else if (topMode === "Advance") {
    day_type = "advance_dominant";
  } else if (topMode === "Stabilize") {
    day_type = "stabilize_dominant";
  } else if (topMode === "Recover") {
    day_type = "recovery_dominant";
  } else {
    // Escape-dominant = a drift day; treat as stabilize-dominant with warning.
    day_type = "stabilize_dominant";
    reasons.push(`Escape mode appeared in ${topCount}/${total} captures — drift risk.`);
  }

  reasons.push(
    `Captures split: ${counts.Advance}A / ${counts.Stabilize}S / ${counts.Recover}R / ${counts.Escape}E.`
  );

  const confidence = bias ? 0.85 : Math.min(1, 0.4 + share);

  return { day_type, confidence, reasoning: reasons.join(" ") };
}

// ---------- 2. Threshold detection ------------------------------------------

export interface ThresholdPatterns {
  dominant_threshold: ThresholdType | null;
  timeline: { period: TimeOfDayBucket; type: ThresholdType | null; count: number }[];
  summary: string;
}

export function detectThresholdPatterns(captures: Capture[]): ThresholdPatterns {
  if (captures.length === 0) {
    return { dominant_threshold: null, timeline: [], summary: "No thresholds yet." };
  }

  const freq = new Map<ThresholdType, number>();
  for (const c of captures) {
    if (!c.threshold_type) continue;
    freq.set(c.threshold_type, (freq.get(c.threshold_type) ?? 0) + 1);
  }
  const dominant_threshold =
    [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Group by time of day and pick the dominant threshold within each bucket.
  const buckets: TimeOfDayBucket[] = [
    "morning",
    "midday",
    "afternoon",
    "evening",
    "night",
  ];
  type TimelineEntry = { period: TimeOfDayBucket; type: ThresholdType | null; count: number };
  const timeline: TimelineEntry[] = [];
  for (const period of buckets) {
    const inBucket = captures.filter(
      (c) => (c.time_of_day_bucket ?? timeOfDayBucket(c.created_at)) === period
    );
    if (inBucket.length === 0) continue;
    const f = new Map<ThresholdType, number>();
    for (const c of inBucket) {
      if (!c.threshold_type) continue;
      f.set(c.threshold_type, (f.get(c.threshold_type) ?? 0) + 1);
    }
    const type = [...f.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    timeline.push({ period, type, count: inBucket.length });
  }

  const summary = dominant_threshold
    ? `Today's dominant threshold is ${dominant_threshold.replace("_", " ")}. ` +
      (timeline.length > 1
        ? `It shifts across the day — watch for the transition.`
        : `It's sitting in one part of the day.`)
    : "Not enough threshold signal yet.";

  return { dominant_threshold, timeline, summary };
}

// ---------- 3. Intent accuracy ---------------------------------------------

export interface IntentAccuracy {
  correct_intent_pct: number;
  mislabel_pct: number;
  drift_pct: number;
  notes: string[];
}

export function analyzeIntentAccuracy(captures: Capture[]): IntentAccuracy {
  if (captures.length === 0) {
    return { correct_intent_pct: 0, mislabel_pct: 0, drift_pct: 0, notes: [] };
  }

  let correct = 0;
  let mislabel = 0;
  let drift = 0;
  const notes: string[] = [];

  for (const c of captures) {
    const mc = c.mode_classification ?? classifyCaptureMode(c);
    const aText = (c.a_intention ?? "").toLowerCase();
    const rec = (c.recommendation ?? "").toLowerCase();
    const looksLikeAdvance =
      aText.includes("advance") ||
      aText.includes("progress") ||
      aText.includes("ship") ||
      aText.includes("finish") ||
      aText.includes("complete");
    const scopedDown =
      rec.includes("reduce scope") ||
      rec.includes("smaller") ||
      rec.includes("15 minute") ||
      rec.includes("minimum");
    const softThreshold =
      c.threshold_type === "energy" || c.threshold_type === "ambiguity";

    if (mc === "Escape") {
      drift++;
      continue;
    }
    if (looksLikeAdvance && softThreshold && scopedDown) {
      mislabel++;
      continue;
    }
    correct++;
  }

  const total = captures.length;
  const toPct = (n: number) => Math.round((n / total) * 100);

  if (mislabel > 0) {
    notes.push(
      `${mislabel} capture${mislabel === 1 ? "" : "s"} labeled as Advance but the threshold and recommendation suggest Stabilize.`
    );
  }
  if (drift > 0) {
    notes.push(
      `${drift} capture${drift === 1 ? "" : "s"} showing Escape behavior — avoidant B with no clear resolution.`
    );
  }
  if (mislabel === 0 && drift === 0) {
    notes.push("Intent matches execution today. No mislabeling detected.");
  }

  return {
    correct_intent_pct: toPct(correct),
    mislabel_pct: toPct(mislabel),
    drift_pct: toPct(drift),
    notes,
  };
}

// ---------- 4. Drift detection ---------------------------------------------

export interface DriftReport {
  drift_risk_score: number; // 0..100
  drift_moments: Capture[];
  suggestions: string[];
}

export function detectDrift(captures: Capture[]): DriftReport {
  if (captures.length === 0) {
    return { drift_risk_score: 0, drift_moments: [], suggestions: [] };
  }

  const drift_moments = captures.filter((c) => {
    const mc = c.mode_classification ?? classifyCaptureMode(c);
    const lowClarity = c.current_mode === "unclear" || c.b_classification === "unclear";
    const unresolved = !c.recommendation || c.outcome_status === null;
    return mc === "Escape" || (lowClarity && unresolved);
  });

  const raw = (drift_moments.length / captures.length) * 100;
  const drift_risk_score = Math.round(Math.min(100, raw + drift_moments.length * 5));

  const suggestions: string[] = [];
  if (drift_risk_score >= 60) {
    suggestions.push("Stop capturing. Do the next 20 minutes of the minimum viable A on your most recent capture.");
  } else if (drift_risk_score >= 30) {
    suggestions.push("Name the threshold out loud before your next task switch.");
  } else if (drift_moments.length === 0) {
    suggestions.push("No drift detected. Protect the streak — don't audit the wins.");
  }
  if (drift_moments.length >= 2) {
    suggestions.push("Same threshold keeps firing. The fix is structural, not willpower.");
  }

  return { drift_risk_score, drift_moments, suggestions };
}

// ---------- 5. Pattern insights (narrative) --------------------------------

export function generatePatternInsights(
  captures: Capture[],
  day: DayClassification,
  thresholds: ThresholdPatterns,
  accuracy: IntentAccuracy,
  drift: DriftReport
): string[] {
  const out: string[] = [];

  if (accuracy.mislabel_pct >= 25) {
    out.push("You tend to label Stabilize work as Advance. The recommendation usually gives it away.");
  }
  if (drift.drift_risk_score >= 40) {
    out.push("Drift risk is elevated — avoidant B is appearing in your captures without resolution.");
  }
  if (thresholds.dominant_threshold === "energy") {
    out.push("Energy is today's main threshold. Structured Stabilize work will beat heroic A attempts.");
  }
  if (thresholds.dominant_threshold === "ambiguity") {
    out.push("Ambiguity is doing more work than fatigue. Define the question before doing more capture.");
  }
  if (thresholds.timeline.some((t) => t.period === "afternoon" && t.type === "energy")) {
    out.push("Afternoon is your energy dip. Schedule physical reset before, not after, it hits.");
  }
  if (day.day_type === "stabilize_dominant") {
    out.push("Constrain A today. Focus on structured B. Avoid drift.");
  }
  if (day.day_type === "recovery_dominant") {
    out.push("This is a recovery day. Advance attempts will cost more than they return.");
  }
  if (out.length === 0) {
    out.push("Signal is consistent today. Keep capturing — patterns sharpen with volume.");
  }
  return out.slice(0, 5);
}

// ---------- 6. Day summary for review --------------------------------------

export interface DaySummary {
  day_type: DayType;
  dominant_intent: ModeClassification | null;
  key_win: string | null;
  key_mistake: string | null;
}

export function summarizeDay(captures: Capture[]): DaySummary {
  const day = classifyDay(captures);
  const modes = captures.map(
    (c) => c.mode_classification ?? classifyCaptureMode(c)
  );
  const count = (m: ModeClassification) => modes.filter((x) => x === m).length;
  const sorted = (
    ["Advance", "Stabilize", "Recover", "Escape"] as ModeClassification[]
  ).sort((a, b) => count(b) - count(a));
  const dominant_intent = sorted[0] ?? null;

  const wins = captures.filter(
    (c) =>
      c.outcome_status === "stayed_in_a" ||
      c.outcome_status === "b_was_correct" ||
      (c.mode_classification ?? classifyCaptureMode(c)) === "Advance"
  );
  const mistakes = captures.filter(
    (c) =>
      c.outcome_status === "regretted_switch" ||
      (c.mode_classification ?? classifyCaptureMode(c)) === "Escape"
  );

  return {
    day_type: day.day_type,
    dominant_intent,
    key_win: wins[0]?.a_intention || wins[0]?.situation_text.slice(0, 90) || null,
    key_mistake:
      mistakes[0]?.b_intention || mistakes[0]?.situation_text.slice(0, 90) || null,
  };
}

// ---------- Decoration — annotate captures with derived fields --------------

export function annotateCaptures(captures: Capture[], dayType?: DayType): Capture[] {
  const day = dayType ?? classifyDay(captures).day_type;
  return captures.map((c) => {
    const mode_classification = classifyCaptureMode(c);
    return {
      ...c,
      mode_classification,
      threshold_triggered: thresholdTriggered(c),
      time_of_day_bucket: c.time_of_day_bucket ?? timeOfDayBucket(c.created_at),
      was_correct_mode: wasCorrectMode({ ...c, mode_classification }, day),
    };
  });
}

// TODO: embeddings-based clustering for pair matching
// TODO: Whoop API integration (live sleep / recovery / HRV)
// TODO: predictive recommendations from historical patterns
// TODO: next-best-action engine using Markov-style transitions across modes

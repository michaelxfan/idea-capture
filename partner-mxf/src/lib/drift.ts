import type { DailyLog, DriftLevel, RepairRecommendation, ActionIntensity, ConfidenceInfo } from "./types";

export function computeDriftScore(logs: DailyLog[]): number {
  const recent = logs.slice(0, 7);
  let score = 0;

  // Days since last meaningful connection (0–40)
  const lastMeaningfulIdx = recent.findIndex((l) => l.meaningful_connection);
  if (lastMeaningfulIdx === -1) score += 40;
  else score += lastMeaningfulIdx * 9;

  // Days since last proactive outreach (0–25)
  const lastProactiveIdx = recent.findIndex((l) => l.initiated_contact);
  if (lastProactiveIdx === -1) score += 25;
  else score += lastProactiveIdx * 5;

  // Inconsistent replies in last 3 days (0–18)
  recent.slice(0, 3).forEach((l) => {
    if (l.replied_consistently === "no") score += 8;
    else if (l.replied_consistently === "somewhat") score += 4;
  });

  // Operator mode in last 3 days (0–12)
  const opDays = recent.slice(0, 3).filter((l) => l.operator_mode).length;
  score += opDays * 4;

  // Guilt/avoidance signals in last 3 days (0–10)
  const guiltDays = recent.slice(0, 3).filter((l) => l.guilt_flags.length > 0).length;
  score += guiltDays * 4;

  return Math.min(100, Math.max(0, score));
}

export function scoreToDriftLevel(score: number): DriftLevel {
  if (score <= 20) return "solid";
  if (score <= 45) return "light-drift";
  if (score <= 70) return "noticeable";
  return "friction";
}

export function driftLevelToNumber(level: DriftLevel): 0 | 1 | 2 | 3 {
  const map: Record<DriftLevel, 0 | 1 | 2 | 3> = {
    solid: 0,
    "light-drift": 1,
    noticeable: 2,
    friction: 3,
  };
  return map[level];
}

function lastConnectionLabel(logs: DailyLog[]): string {
  const idx = logs.findIndex((l) => l.meaningful_connection);
  if (idx === -1) return "No recent connection logged";
  if (idx === 0) return "Today";
  if (idx === 1) return "Yesterday";
  return `${idx} days ago`;
}

function lastProactiveLabel(logs: DailyLog[]): string {
  const idx = logs.findIndex((l) => l.initiated_contact);
  if (idx === -1) return "No recent proactive contact logged";
  if (idx === 0) return "Today";
  if (idx === 1) return "Yesterday";
  return `${idx} days ago`;
}

function buildWhy(logs: DailyLog[], level: DriftLevel): string {
  const recent = logs.slice(0, 7);
  const signals: string[] = [];

  const inconsistentDays = recent.slice(0, 3).filter(
    (l) => l.replied_consistently === "no" || l.replied_consistently === "somewhat"
  ).length;
  if (inconsistentDays >= 2) signals.push(`slow replies for ${inconsistentDays} days`);

  const lastProactive = recent.findIndex((l) => l.initiated_contact);
  if (lastProactive >= 2) signals.push(`no proactive touchpoint in ${lastProactive} days`);
  else if (lastProactive === -1) signals.push("no proactive touchpoint recently");

  const lastMeaningful = recent.findIndex((l) => l.meaningful_connection);
  if (lastMeaningful >= 3) signals.push(`last real connection ${lastMeaningful} days ago`);
  else if (lastMeaningful === -1) signals.push("no meaningful connection logged this week");

  const opDays = recent.slice(0, 3).filter((l) => l.operator_mode).length;
  if (opDays >= 2) signals.push(`operator mode ${opDays} days running`);

  if (signals.length === 0) {
    if (level === "solid") return "Communication has been consistent and warm.";
    return "Slight dip in engagement over the past few days.";
  }

  return signals
    .map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s))
    .join(" + ");
}

interface Messages {
  light: string;
  direct: string;
  warm: string;
}

function buildMessages(level: DriftLevel): Messages {
  const messages: Record<DriftLevel, Messages> = {
    solid: {
      light: "Hey — thinking of you. How's your day going?",
      direct: "Want to grab dinner this week? No agenda, just catching up.",
      warm: "I've been in a good headspace lately. Want to spend some real time together soon?",
    },
    "light-drift": {
      light: "Hey, I've been a bit in my own world the last couple days — how's your day been?",
      direct: "I feel like I've been a bit heads-down lately. Want to connect properly soon?",
      warm: "I realize I've been a bit absorbed lately. Not intentional — want to catch up?",
    },
    noticeable: {
      light: "Hey — I know I've been a bit off the grid. Thinking of you.",
      direct:
        "I feel like I've been a bit off the grid lately — not intentional. Want to catch up properly this week?",
      warm: "I realize I've been pretty checked out the last few days. That's on me. I'd like to reset and spend proper time together.",
    },
    friction: {
      light: "I know things have felt a bit off. I'm here and I want to fix that.",
      direct:
        "I've been checked out and I own that. Can we make time this week — properly, no phones?",
      warm: "I've been distant and I know it. I don't want to let that keep going. Can we talk and reset?",
    },
  };
  return messages[level];
}

function buildAction(level: DriftLevel): { action: string; intensity: ActionIntensity } {
  const actions: Record<DriftLevel, { action: string; intensity: ActionIntensity }> = {
    solid: {
      action: "Stay the course. A warm check-in or small gesture of presence is all that's needed.",
      intensity: "none",
    },
    "light-drift": {
      action: "Send a warm, unprompted message. Keep it light. No apology paragraph.",
      intensity: "message",
    },
    noticeable: {
      action: "Acknowledge lightly, then plan a specific 60–90 min hang this week.",
      intensity: "coffee-walk",
    },
    friction: {
      action:
        "Direct ownership + specific repair plan. Quality time block, no rescheduling. No repeated apologizing.",
      intensity: "quality-time-block",
    },
  };
  return actions[level];
}

function buildGuardrail(level: DriftLevel): string | null {
  const guardrails: Record<DriftLevel, string | null> = {
    solid: null,
    "light-drift":
      "Do not send a gift or over-explain. That creates unnecessary intensity. One warm message is enough.",
    noticeable:
      "Do not send flowers or an apology gift. One clear message + one planned hang is the right response.",
    friction:
      "Do not repeatedly apologize or over-communicate remorse. One direct acknowledgment, one concrete plan. Execution matters more than words.",
  };
  return guardrails[level];
}

export function buildRecommendation(logs: DailyLog[]): RepairRecommendation {
  const score = computeDriftScore(logs);
  const level = scoreToDriftLevel(score);
  const levelNum = driftLevelToNumber(level);
  const messages = buildMessages(level);
  const { action, intensity } = buildAction(level);

  return {
    level: levelNum,
    drift_level: level,
    drift_score: score,
    why: buildWhy(logs, level),
    say_light: messages.light,
    say_direct: messages.direct,
    say_warm: messages.warm,
    do: action,
    action_intensity: intensity,
    guardrail: buildGuardrail(level),
    generated_at: new Date().toISOString(),
  };
}

export function getLastMeaningful(logs: DailyLog[]): string | null {
  const idx = logs.findIndex((l) => l.meaningful_connection);
  if (idx === -1) return null;
  return lastConnectionLabel(logs);
}

export function getLastProactive(logs: DailyLog[]): string | null {
  const idx = logs.findIndex((l) => l.initiated_contact);
  if (idx === -1) return null;
  return lastProactiveLabel(logs);
}

export function computeConfidence(
  logCount: number,
  sessionCount: number
): ConfidenceInfo {
  if (logCount === 0) {
    return {
      level: "low",
      label: "Low confidence",
      reason: "No logs yet. Add daily logs to build pattern detection.",
    };
  }
  if (logCount < 3) {
    return {
      level: "low",
      label: "Low confidence",
      reason: `Based on ${logCount} log${logCount === 1 ? "" : "s"}. Needs ~7 for stable patterns.`,
    };
  }
  if (logCount < 7 || sessionCount < 2) {
    return {
      level: "medium",
      label: "Medium confidence",
      reason: `Based on ${logCount} logs${sessionCount > 0 ? `, ${sessionCount} analyze session${sessionCount === 1 ? "" : "s"}` : ""}. Keep logging for better accuracy.`,
    };
  }
  return {
    level: "high",
    label: "High confidence",
    reason: `Based on ${logCount} logs and ${sessionCount} analyze sessions.`,
  };
}

export function buildTodayObjective(level: DriftLevel): string {
  const objectives: Record<DriftLevel, string> = {
    solid: "Maintain warmth and stay present. Things are in a good place.",
    "light-drift": "Rebuild warmth without pressure. One genuine touchpoint is enough.",
    noticeable: "Acknowledge the gap and plan specific time together this week.",
    friction: "Direct ownership and a concrete repair plan. Execution over words.",
  };
  return objectives[level];
}

export function buildWhatNotToDo(level: DriftLevel): string {
  const rules: Record<DriftLevel, string> = {
    solid: "Don't over-communicate or introduce intensity where there isn't any.",
    "light-drift": "Don't over-explain, apologize unprompted, or send multiple messages. One warm message is enough.",
    noticeable: "Don't send gifts or write a long apology. One clear message and one planned hang is the right move.",
    friction: "Don't repeatedly apologize or flood her with messages. One direct acknowledgment, one concrete plan.",
  };
  return rules[level];
}

export function buildWhyFitsProfile(level: DriftLevel, profileName: string): string {
  const reasons: Record<DriftLevel, string> = {
    solid: `${profileName}'s profile responds well to consistent, low-pressure presence. Staying steady is the right call.`,
    "light-drift": `${profileName}'s profile suggests consistency and calm re-engagement work better than intensity or over-explanation.`,
    noticeable: `Given ${profileName}'s attachment style, a low-key reconnection plan signals reliability without creating pressure.`,
    friction: `${profileName}'s profile rebuilds trust through consistent follow-through, not repeated words. A concrete plan matters more than apologies.`,
  };
  return reasons[level];
}

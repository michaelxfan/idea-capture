import { fetchRecentLogs } from "@/lib/db";
import { buildRecommendation } from "@/lib/drift";
import DriftBadge from "@/components/DriftBadge";
import Card, { SectionLabel } from "@/components/Card";
import type { DriftLevel } from "@/lib/types";
import Link from "next/link";

const LEVELS = [
  {
    level: 0 as const,
    drift_level: "solid" as DriftLevel,
    title: "Level 0 — Solid",
    signals: ["Consistent replies", "Proactive outreach", "Recent meaningful connection"],
    action: "No repair needed. Maintain warmth and presence.",
    intensity: "Continue showing up. A light check-in or shared moment is all.",
    guardrail: null,
  },
  {
    level: 1 as const,
    drift_level: "light-drift" as DriftLevel,
    title: "Level 1 — Light Drift",
    signals: ["Slightly slower replies", "A day or two without proactive contact", "No major tension"],
    action: "One warm, unprompted message. Keep it light.",
    intensity: "No apology paragraph. No gift. Just resume warmth.",
    guardrail: "Do not over-explain or apologize. That creates unnecessary weight.",
  },
  {
    level: 2 as const,
    drift_level: "noticeable" as DriftLevel,
    title: "Level 2 — Noticeable Drift",
    signals: ["2–3 days of low communication", "Less proactive effort", "You've been in operator mode"],
    action: "Acknowledge lightly. Suggest a specific catch-up this week.",
    intensity: "Coffee or walk (60–90 min). Optional small thoughtful gesture — only if natural.",
    guardrail:
      "Do not send flowers. One clear message + one planned hang is the right response. No repeated apologizing.",
  },
  {
    level: 3 as const,
    drift_level: "friction" as DriftLevel,
    title: "Level 3 — Friction Risk",
    signals: [
      "They seem off",
      "You've been checked out",
      "There may be emotional distance",
      "Guilt or avoidance present",
    ],
    action: "Direct ownership + specific repair plan. Quality time block.",
    intensity: "A real conversation. No phones. Quality time, not just proximity.",
    guardrail:
      "Do not apologize repeatedly. Do not send a gift as a shortcut. One direct acknowledgment, one concrete plan. Execution matters more than words.",
  },
];

export default async function RepairPage() {
  const logs = await fetchRecentLogs(14);
  const rec = buildRecommendation(logs);
  const current = LEVELS.find((l) => l.level === rec.level) ?? LEVELS[0];

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">
          Repair Guide
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          Your Calibration
        </h1>
      </div>

      {/* Current level card */}
      <Card className="!p-6">
        <div className="flex items-center justify-between mb-4">
          <DriftBadge level={rec.drift_level} size="md" />
          <span className="text-sm text-ink-muted font-medium">Score {rec.drift_score}</span>
        </div>
        <p className="text-sm text-ink-muted mb-4 leading-relaxed">
          <span className="text-ink font-medium">Signal: </span>
          {rec.why}
        </p>

        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <SectionLabel>Action</SectionLabel>
            <p className="text-sm text-ink leading-relaxed">{current.action}</p>
          </div>
          <div>
            <SectionLabel>Intensity</SectionLabel>
            <p className="text-sm text-ink-muted leading-relaxed">{current.intensity}</p>
          </div>
          {current.guardrail && (
            <div className="bg-surface-subtle rounded-xl px-4 py-3 border border-border-subtle">
              <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">
                Guardrail
              </p>
              <p className="text-sm text-ink-muted leading-relaxed">{current.guardrail}</p>
            </div>
          )}
        </div>

        <Link href="/messages">
          <button className="w-full h-12 mt-5 bg-ink text-surface rounded-xl text-sm font-medium">
            See Message Options →
          </button>
        </Link>
      </Card>

      {/* All 4 levels */}
      <div>
        <SectionLabel>All Levels</SectionLabel>
        <div className="space-y-3">
          {LEVELS.map((lvl) => {
            const isCurrent = lvl.level === rec.level;
            return (
              <Card
                key={lvl.level}
                className={`!p-4 ${isCurrent ? "ring-1 ring-ink" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <DriftBadge level={lvl.drift_level} size="sm" />
                  {isCurrent && (
                    <span className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium">
                      Current
                    </span>
                  )}
                </div>
                <ul className="space-y-1 mb-3">
                  {lvl.signals.map((s) => (
                    <li key={s} className="text-xs text-ink-muted flex gap-2">
                      <span className="text-ink-subtle mt-0.5">–</span>
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink">{lvl.action}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { fetchRecentLogs, fetchConversations, fetchAnalyzeOutcomes } from "@/lib/db";
import { computeDriftScore, scoreToDriftLevel, computeConfidence } from "@/lib/drift";
import DriftBadge from "@/components/DriftBadge";
import Card, { SectionLabel } from "@/components/Card";
import Link from "next/link";
import type { DailyLog, DriftLevel } from "@/lib/types";

function computeHealthScore(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const recent = logs.slice(0, 14);
  let totalScore = 0;
  let totalWeight = 0;
  recent.forEach((log, i) => {
    const weight = Math.max(1, 14 - i);
    const dayDrift = (() => {
      let s = 0;
      if (log.replied_consistently === "no") s += 20;
      if (log.replied_consistently === "somewhat") s += 10;
      if (!log.initiated_contact) s += 10;
      if (!log.meaningful_connection) s += 10;
      if (log.operator_mode) s += 8;
      if (log.guilt_flags.length > 0) s += 8;
      return Math.min(100, s);
    })();
    totalScore += (100 - dayDrift) * weight;
    totalWeight += weight;
  });
  return Math.round(totalScore / totalWeight);
}

function computeTrend(logs: DailyLog[]): "improving" | "stable" | "declining" {
  if (logs.length < 7) return "stable";
  const recent7 = computeHealthScore(logs.slice(0, 7));
  const prior7 = computeHealthScore(logs.slice(7, 14));
  if (prior7 === 0) return "stable";
  const delta = recent7 - prior7;
  if (delta >= 8) return "improving";
  if (delta <= -8) return "declining";
  return "stable";
}

function detectPatterns(logs: DailyLog[]): { goingWell: string[]; needsWork: string[] } {
  if (logs.length === 0) return { goingWell: [], needsWork: [] };
  const recent = logs.slice(0, 14);
  const goingWell: string[] = [];
  const needsWork: string[] = [];

  const meaningfulDays = recent.filter((l) => l.meaningful_connection).length;
  const initiatedDays = recent.filter((l) => l.initiated_contact).length;
  const yesReplyDays = recent.filter((l) => l.replied_consistently === "yes").length;
  const noReplyDays = recent.filter((l) => l.replied_consistently === "no").length;
  const operatorDays = recent.filter((l) => l.operator_mode).length;
  const guiltDays = recent.filter((l) => l.guilt_flags.length > 0).length;
  const total = recent.length;

  if (meaningfulDays >= Math.floor(total * 0.4)) goingWell.push(`Meaningful connection ${meaningfulDays} of ${total} days`);
  if (initiatedDays >= Math.floor(total * 0.4)) goingWell.push(`Proactive outreach ${initiatedDays} of ${total} days`);
  if (yesReplyDays >= Math.floor(total * 0.6)) goingWell.push(`Consistent replies ${yesReplyDays} of ${total} days`);
  if (operatorDays < Math.floor(total * 0.25)) goingWell.push("Low operator mode presence");
  if (guiltDays < Math.floor(total * 0.2)) goingWell.push("Few guilt or avoidance signals");

  const lastMeaningful = recent.findIndex((l) => l.meaningful_connection);
  if (lastMeaningful >= 5 || lastMeaningful === -1) needsWork.push(`No meaningful connection in ${lastMeaningful === -1 ? `${total}+` : lastMeaningful} days`);
  const lastProactive = recent.findIndex((l) => l.initiated_contact);
  if (lastProactive >= 5 || lastProactive === -1) needsWork.push(`No proactive outreach in ${lastProactive === -1 ? `${total}+` : lastProactive} days`);
  if (noReplyDays >= Math.floor(total * 0.25)) needsWork.push(`Inconsistent replies ${noReplyDays} of ${total} days`);
  if (operatorDays >= Math.floor(total * 0.5)) needsWork.push(`Operator mode ${operatorDays} of ${total} days — presence is low`);
  if (guiltDays >= Math.floor(total * 0.4)) needsWork.push("Guilt or avoidance signals appearing frequently");

  return { goingWell: goingWell.slice(0, 4), needsWork: needsWork.slice(0, 4) };
}

const trendConfig = {
  improving: { label: "↑ Improving", color: "text-solid bg-solid-bg border-solid-border" },
  stable: { label: "→ Stable", color: "text-light-drift bg-light-drift-bg border-light-drift-border" },
  declining: { label: "↓ Declining", color: "text-friction bg-friction-bg border-friction-border" },
};

const scoreColor = (s: number) =>
  s >= 70 ? "text-solid" : s >= 45 ? "text-light-drift" : s >= 25 ? "text-noticeable" : "text-friction";

const confidenceBadgeColors = {
  low: "text-friction bg-friction-bg border-friction-border",
  medium: "text-light-drift bg-light-drift-bg border-light-drift-border",
  high: "text-solid bg-solid-bg border-solid-border",
};

export default async function SummaryPage() {
  const [logs, conversations, outcomes] = await Promise.all([
    fetchRecentLogs(28),
    fetchConversations(20),
    fetchAnalyzeOutcomes(20),
  ]);

  const health = computeHealthScore(logs);
  const trend = computeTrend(logs);
  const { goingWell, needsWork } = detectPatterns(logs);
  const currentDrift = computeDriftScore(logs.slice(0, 7));
  const driftLevel = scoreToDriftLevel(currentDrift);
  const confidence = computeConfidence(logs.length, conversations.length);
  const { label: trendLabel, color: trendColor } = trendConfig[trend];

  const levelColors: Record<DriftLevel, string> = {
    solid: "text-solid", "light-drift": "text-light-drift",
    noticeable: "text-noticeable", friction: "text-friction",
  };

  const hasData = logs.length > 0;

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Summary</p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Relationship Health</h1>
      </div>

      {!hasData ? (
        <Card className="text-center !py-8">
          <p className="text-sm font-medium text-ink mb-1">No data yet</p>
          <p className="text-sm text-ink-muted mb-4">
            Start logging daily to activate health scoring and pattern detection.
          </p>
          <Link href="/log">
            <span className="inline-flex h-11 px-6 items-center bg-ink text-surface rounded-full text-sm font-medium">Log Today</span>
          </Link>
        </Card>
      ) : (
        <>
          {/* Health Score */}
          <Card className="!p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-2">Health Score</p>
                <p className={`text-6xl font-semibold tracking-tight ${scoreColor(health)}`}>{health}</p>
                <p className="text-xs text-ink-subtle mt-1">
                  Based on {Math.min(logs.length, 14)} of {logs.length} log{logs.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${trendColor}`}>{trendLabel}</span>
                <DriftBadge level={driftLevel} size="sm" />
              </div>
            </div>

            <div className="h-2 bg-surface-subtle rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${
                  health >= 70 ? "bg-solid" : health >= 45 ? "bg-light-drift" : health >= 25 ? "bg-noticeable" : "bg-friction"
                }`}
                style={{ width: `${health}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-ink-subtle mb-4">
              <span>0</span><span>50</span><span>100</span>
            </div>

            {/* Confidence badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium ${confidenceBadgeColors[confidence.level]}`}>
              <span>{confidence.label}</span>
              <span className="opacity-60">·</span>
              <span className="font-normal opacity-80">{confidence.reason}</span>
            </div>
          </Card>

          {/* Outcome summary */}
          {outcomes.length > 0 && (
            <Card>
              <SectionLabel>Outcome History</SectionLabel>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Helped", count: outcomes.filter((o) => o.outcome === "helped").length, color: "text-solid" },
                  { label: "Neutral", count: outcomes.filter((o) => o.outcome === "neutral").length, color: "text-ink-muted" },
                  { label: "Made Worse", count: outcomes.filter((o) => o.outcome === "made-worse").length, color: "text-friction" },
                ].map(({ label, count, color }) => (
                  <div key={label}>
                    <p className={`text-2xl font-semibold ${color}`}>{count}</p>
                    <p className="text-[11px] text-ink-subtle mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {outcomes.length < 3 && (
                <p className="text-[11px] text-ink-subtle mt-3 pt-3 border-t border-border">
                  Log outcomes after each Analyze session to build pattern data.
                </p>
              )}
            </Card>
          )}

          {/* Going well */}
          {goingWell.length > 0 && (
            <Card>
              <SectionLabel>Going Well</SectionLabel>
              <ul className="space-y-2">
                {goingWell.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-ink">
                    <span className="text-solid mt-0.5 shrink-0">✓</span>{item}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Needs improvement */}
          {needsWork.length > 0 && (
            <Card>
              <SectionLabel>Needs Improvement</SectionLabel>
              <ul className="space-y-2">
                {needsWork.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-ink">
                    <span className="text-noticeable mt-0.5 shrink-0">↗</span>{item}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 14-day log streak */}
          <div>
            <SectionLabel>14-Day Log</SectionLabel>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 14 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split("T")[0];
                const log = logs.find((l) => l.log_date === dateStr);
                const isGood = !!log && log.meaningful_connection;
                const isPartial = !!log && !log.meaningful_connection;
                return (
                  <div key={i} title={log ? log.log_date : "No log"}
                    className={`w-7 h-7 rounded-lg ${
                      isGood ? "bg-solid" : isPartial ? "bg-light-drift-bg border border-light-drift-border" : "bg-surface-subtle border border-border"
                    }`} />
                );
              })}
            </div>
            <p className="text-[11px] text-ink-subtle mt-2">Filled = logged · Dark = meaningful connection</p>
          </div>

          {/* Recent analyze sessions */}
          {conversations.length > 0 && (
            <div>
              <SectionLabel>Recent Analyze Sessions</SectionLabel>
              <div className="space-y-2">
                {conversations.slice(0, 5).map((c) => {
                  const date = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <Link key={c.id} href={`/analyze/${c.id}`}>
                      <div className="bg-surface border border-border rounded-2xl px-4 py-3 shadow-card flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[11px] uppercase tracking-widest font-medium ${c.drift_level ? levelColors[c.drift_level] : "text-ink-subtle"}`}>
                              {c.drift_level ?? "—"}
                            </span>
                            <span className="text-[11px] text-ink-subtle">{date}</span>
                          </div>
                          <p className="text-xs text-ink-muted truncate">{c.summary ?? "No summary"}</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-subtle shrink-0 mt-0.5">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

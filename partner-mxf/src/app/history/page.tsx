"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DriftBadge from "@/components/DriftBadge";
import { SectionLabel } from "@/components/Card";
import type { DailyLog, RepairOutcome, AnalyzeOutcome } from "@/lib/types";

const replyLabel: Record<string, string> = {
  yes: "Consistent replies",
  somewhat: "Spotty replies",
  no: "Didn't reply well",
};

function LogRow({ log, onDelete }: { log: DailyLog; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/logs/${log.id}`, { method: "DELETE" });
    onDelete(log.id);
  };

  const date = new Date(log.log_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-4 shadow-card">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-sm font-medium text-ink">{date}</p>
        <div className="flex items-center gap-2">
          {log.meaningful_connection && (
            <span className="text-[10px] uppercase tracking-widest text-solid font-medium bg-solid-bg border border-solid-border px-2 py-0.5 rounded-full">Connected</span>
          )}
          {log.initiated_contact && (
            <span className="text-[10px] uppercase tracking-widest text-light-drift font-medium bg-light-drift-bg border border-light-drift-border px-2 py-0.5 rounded-full">Proactive</span>
          )}
        </div>
      </div>
      <p className="text-xs text-ink-muted">{replyLabel[log.replied_consistently]}</p>
      {log.operator_mode && <p className="text-xs text-ink-subtle mt-0.5">Operator mode</p>}
      {log.guilt_flags.length > 0 && (
        <p className="text-xs text-ink-subtle mt-0.5">Signals: {log.guilt_flags.join(", ")}</p>
      )}
      {log.notes && <p className="text-xs text-ink-muted mt-2 italic">{log.notes}</p>}
      <div className="mt-3 pt-3 border-t border-border flex justify-end">
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="text-xs text-ink-subtle h-7 px-3 border border-border rounded-full">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="text-xs text-friction h-7 px-3 border border-friction-border rounded-full bg-friction-bg">
              {deleting ? "Deleting…" : "Confirm Delete"}
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-xs text-ink-subtle opacity-40 hover:opacity-100 transition-opacity">Delete</button>
        )}
      </div>
    </div>
  );
}

function PatternInsights({ outcomes }: { outcomes: AnalyzeOutcome[] }) {
  if (outcomes.length < 2) {
    return (
      <div className="bg-surface-subtle border border-border-subtle rounded-2xl px-5 py-4">
        <SectionLabel>Pattern Insights</SectionLabel>
        <p className="text-sm text-ink-muted">
          Not enough history yet. Log outcomes after Analyze sessions to detect patterns.
        </p>
        <Link href="/analyze">
          <p className="text-[11px] text-ink-subtle mt-2 underline underline-offset-2">Go to Analyze →</p>
        </Link>
      </div>
    );
  }

  const helped = outcomes.filter((o) => o.outcome === "helped" && o.followed !== "no");
  const madeWorse = outcomes.filter((o) => o.outcome === "made-worse");
  const followed = outcomes.filter((o) => o.followed === "yes");
  const followedRate = Math.round((followed.length / outcomes.length) * 100);

  const insights: string[] = [];
  if (helped.length >= 2) insights.push(`Following the recommendation helped ${helped.length} of ${outcomes.length} times.`);
  if (madeWorse.length >= 2) insights.push(`${madeWorse.length} outcomes got worse — check notes for patterns.`);
  const highFollowRate = followed.length >= Math.ceil(outcomes.length * 0.7);
  if (highFollowRate) insights.push(`You followed recommendations ${followedRate}% of the time.`);

  return (
    <div className="bg-surface border border-border rounded-2xl px-5 py-4 shadow-card space-y-4">
      <SectionLabel>Pattern Insights</SectionLabel>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Helped", count: helped.length, color: "text-solid" },
          { label: "Neutral", count: outcomes.filter((o) => o.outcome === "neutral").length, color: "text-ink-muted" },
          { label: "Made Worse", count: madeWorse.length, color: "text-friction" },
        ].map(({ label, count, color }) => (
          <div key={label}>
            <p className={`text-2xl font-semibold ${color}`}>{count}</p>
            <p className="text-[11px] text-ink-subtle">{label}</p>
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          {insights.map((ins, i) => (
            <p key={i} className="text-sm text-ink-muted leading-relaxed">
              <span className="text-ink-subtle mr-1">→</span> {ins}
            </p>
          ))}
        </div>
      )}

      {helped.length >= 2 && (
        <div className="pt-3 border-t border-border">
          <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-2">Actions That Helped</p>
          <div className="space-y-1.5">
            {helped.slice(0, 3).map((o) => (
              <p key={o.id} className="text-xs text-ink-muted leading-relaxed">
                · {o.recommended_action ?? "Analyze recommendation"}
              </p>
            ))}
          </div>
        </div>
      )}

      {madeWorse.length >= 1 && (
        <div className="pt-3 border-t border-border">
          <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-2">Watch Out For</p>
          <div className="space-y-1.5">
            {madeWorse.slice(0, 2).map((o) => (
              <p key={o.id} className="text-xs text-ink-muted leading-relaxed">
                · {o.recommended_action ?? "Recommendation not followed"}{o.notes ? ` — ${o.notes}` : ""}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [outcomes, setOutcomes] = useState<RepairOutcome[]>([]);
  const [analyzeOutcomes, setAnalyzeOutcomes] = useState<AnalyzeOutcome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/logs?limit=30").then((r) => r.json()),
      fetch("/api/outcomes").then((r) => r.json()),
      fetch("/api/analyze-outcomes").then((r) => r.json()),
    ]).then(([l, o, ao]) => {
      setLogs(l.logs ?? []);
      setOutcomes(o.outcomes ?? []);
      setAnalyzeOutcomes(ao.outcomes ?? []);
      setLoading(false);
    });
  }, []);

  const handleDelete = (id: string) => setLogs((prev) => prev.filter((l) => l.id !== id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">History</p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Logs & Patterns</h1>
      </div>

      {/* Pattern Insights */}
      <PatternInsights outcomes={analyzeOutcomes} />

      {/* Repair Outcomes */}
      {outcomes.length > 0 && (
        <div>
          <SectionLabel>Past Repairs</SectionLabel>
          <div className="space-y-3">
            {outcomes.map((o) => {
              const date = new Date(o.log_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={o.id} className="bg-surface border border-border rounded-2xl px-4 py-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <DriftBadge level={o.drift_level} size="sm" />
                    <span className="text-xs text-ink-muted">{date}</span>
                  </div>
                  {o.message_used && <p className="text-xs text-ink italic mb-2">&ldquo;{o.message_used}&rdquo;</p>}
                  <div className="flex gap-4 text-xs">
                    {o.landed && (
                      <span className="text-ink-muted">
                        Landed: <span className={o.landed === "yes" ? "text-solid font-medium" : "text-noticeable font-medium"}>{o.landed}</span>
                      </span>
                    )}
                    {o.overdid && <span className="text-noticeable">Overdid it</span>}
                    {o.underdid && <span className="text-light-drift">Underdid it</span>}
                  </div>
                  {o.notes && <p className="text-xs text-ink-muted mt-2">{o.notes}</p>}
                </div>
              );
            })}
          </div>
          <Link href="/learning">
            <button className="w-full mt-3 h-11 border border-border rounded-2xl text-sm text-ink-muted font-medium">
              Log a New Outcome →
            </button>
          </Link>
        </div>
      )}

      {/* Daily logs */}
      <div>
        <SectionLabel>Daily Logs</SectionLabel>
        {logs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-ink-muted mb-3">No logs yet.</p>
            <Link href="/log">
              <button className="h-11 px-6 bg-ink text-surface rounded-full text-sm font-medium">Log Today</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <LogRow key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

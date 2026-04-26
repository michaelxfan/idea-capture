"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Stakeholder } from "@/lib/types";
import { labelDay, todayWeekday } from "@/lib/days";

interface Ranked {
  stakeholderId: string;
  name: string;
  rank: number;
  whyToday: string;
  talkingPoints: string[];
  smallNudge: string;
  doNotBringUpYet: string;
  leaveWith: string;
}

export default function InPersonClient({
  all: initialAll,
}: {
  all: Stakeholder[];
  inOfficeCount: number;
}) {
  const router = useRouter();
  // Local copy so toggles are reflected immediately without a round-trip
  const [all, setAll] = useState(initialAll);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Guard against React StrictMode double-firing useEffect in dev
  const didInit = useRef(false);

  const today = todayWeekday();

  const inOffice = all.filter((s) => s.isInOffice);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/in-person", { method: "POST" });
      const data = await res.json();
      setRanked(data.ranked ?? []);
      if (data.message) setMessage(data.message);
      else if (data.mock)
        setMessage("AI running in stub mode — add INFLUENCE_COACH_ANTHROPIC_KEY for real coaching.");
    } catch {
      setMessage("Failed to generate plan. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function applySchedule() {
    setApplying(true);
    try {
      const res = await fetch("/api/stakeholders/apply-schedule", { method: "POST" });
      const data = await res.json();
      // Update local state to match schedule
      setAll((prev) =>
        prev.map((s) => ({ ...s, isInOffice: s.officeDays.includes(today) }))
      );
      setMessage(`Schedule applied for ${labelDay(data.today)}day — ${data.inOffice} in office.`);
      void run();
      router.refresh();
    } finally {
      setApplying(false);
    }
  }

  async function toggle(id: string, next: boolean) {
    // Optimistic update so the toggle feels instant
    setAll((prev) => prev.map((s) => (s.id === id ? { ...s, isInOffice: next } : s)));
    await fetch(`/api/stakeholders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInOffice: next }),
    });
    // Regenerate the plan with the updated in-office set, then sync server state
    void run();
    router.refresh();
  }

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (initialAll.some((s) => s.isInOffice)) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      {/* Toggle panel */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display text-base font-semibold">
            In office today ({inOffice.length} / {all.length})
            <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)] normal-case">
              {labelDay(today)}day
            </span>
          </h3>
          <div className="flex gap-2">
            <button
              className="btn"
              onClick={applySchedule}
              disabled={applying || loading}
              title="Auto-set in-office status based on each person's typical schedule"
            >
              {applying ? "Applying…" : "Apply today's schedule"}
            </button>
            <button
              className="btn btn-primary"
              onClick={run}
              disabled={loading || inOffice.length === 0}
            >
              {loading ? "Ranking…" : "Refresh plan"}
            </button>
          </div>
        </div>
        {/* flex-wrap avoids the orphan-cell problem of a fixed grid */}
        <div className="flex flex-wrap gap-2">
          {all.map((s) => (
            <button
              key={s.id}
              onClick={() => toggle(s.id, !s.isInOffice)}
              className={`text-left p-2 rounded-lg border transition-colors flex-1 min-w-[140px] ${
                s.isInOffice
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]"
              }`}
              title={s.isInOffice ? "Click to mark remote" : "Click to mark in office"}
            >
              <div className="text-sm font-medium truncate">{s.name}</div>
              <div className="text-xs text-[var(--text-tertiary)] truncate">{s.title}</div>
              <div className={`text-xs mt-1 font-medium ${s.isInOffice ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}`}>
                {s.isInOffice ? "In office" : "Remote"}
              </div>
              {s.officeDays.length > 0 && (
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                  {s.officeDays.map(labelDay).join(" · ")}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {message ? <div className="chip chip-warn">{message}</div> : null}

      {/* Loading state */}
      {loading && (
        <div className="card p-6 text-center text-sm text-[var(--text-secondary)]">
          Generating today's conversation plan…
        </div>
      )}

      {/* Ranked plan */}
      {!loading && ranked.length === 0 && (
        <div className="card p-6 text-center text-sm text-[var(--text-secondary)]">
          {inOffice.length === 0
            ? "No one marked in office yet. Toggle the cards above to get started."
            : "Click \"Refresh today's plan\" to generate your conversation guide."}
        </div>
      )}

      {!loading && ranked.length > 0 && (
        <ol className="space-y-4">
          {[...ranked].sort((a, b) => a.rank - b.rank).map((r) => (
            <li key={r.stakeholderId} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                    Rank #{r.rank}
                  </div>
                  <div className="font-display text-lg font-semibold">{r.name}</div>
                </div>
                <Link href={`/stakeholders/${r.stakeholderId}`} className="btn btn-ghost shrink-0">
                  Open profile →
                </Link>
              </div>
              <p className="text-sm mt-2 text-[var(--text-secondary)]">
                <span className="text-[var(--text-tertiary)] uppercase tracking-wide text-xs mr-2">
                  Why today
                </span>
                {r.whyToday}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="card-alt p-3">
                  <div className="label">Talking points</div>
                  <ul className="text-sm space-y-1.5">
                    {r.talkingPoints.map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[var(--text-tertiary)] shrink-0">·</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <div className="card-alt p-3">
                    <div className="label">Small nudge</div>
                    <div className="text-sm">{r.smallNudge}</div>
                  </div>
                  <div className="card-alt p-3">
                    <div className="label">Don't bring up yet</div>
                    <div className="text-sm">{r.doNotBringUpYet}</div>
                  </div>
                  <div className="card-alt p-3 border border-[var(--brand-soft)]">
                    <div className="label">Leave them with</div>
                    <div className="text-sm font-medium">{r.leaveWith}</div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

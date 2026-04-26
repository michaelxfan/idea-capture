"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FilterBar, { type Filters } from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
import DailySummaryCard from "@/components/DailySummaryCard";
import { useCaptures } from "@/lib/useStore";
import { store } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import { summarizeDay } from "@/lib/analysis";
import type { Capture, OutcomeStatus } from "@/types";

const OUTCOMES: { value: NonNullable<OutcomeStatus>; label: string }[] = [
  { value: "stayed_in_a", label: "Stayed in A" },
  { value: "switched_to_b", label: "Switched to B" },
  { value: "b_was_correct", label: "B was correct" },
  { value: "regretted_switch", label: "Regretted switch" },
  { value: "learned", label: "Learned something" },
];

const MODE_COLOR: Record<string, string> = {
  Advance: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Stabilize: "bg-amber-50 text-amber-800 border-amber-200",
  Recover: "bg-sky-50 text-sky-800 border-sky-200",
  Escape: "bg-red-50 text-red-800 border-red-200",
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ReviewClient() {
  const { captures, hydrated } = useCaptures();
  const [filters, setFilters] = useState<Filters>({
    q: "",
    domain: null,
    mode: null,
    bClass: null,
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const todays = useMemo(() => {
    const s = startOfToday();
    return captures.filter((c) => new Date(c.created_at) >= s);
  }, [captures]);

  const daySummary = useMemo(
    () => (todays.length > 0 ? summarizeDay(todays) : null),
    [todays]
  );

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return captures.filter((c) => {
      if (q && !c.situation_text.toLowerCase().includes(q)) return false;
      if (filters.domain && c.domain !== filters.domain) return false;
      if (filters.mode && c.current_mode !== filters.mode) return false;
      if (filters.bClass && c.b_classification !== filters.bClass) return false;
      return true;
    });
  }, [captures, filters]);

  function update(id: string, patch: Partial<Capture>) {
    store.update(id, patch);
  }

  if (!hydrated) {
    return <div className="card p-8 text-sm text-ink-400">Loading…</div>;
  }

  if (captures.length === 0) {
    return (
      <EmptyState
        title="Nothing to review yet."
        body="Captures will appear here once you make them."
        cta={<Link href="/capture" className="btn-primary">+ Capture</Link>}
      />
    );
  }

  return (
    <div>
      {daySummary && <DailySummaryCard summary={daySummary} />}

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <div className="md:sticky md:top-24 md:self-start">
          <FilterBar value={filters} onChange={setFilters} />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-400 px-2">No captures match those filters.</p>
          ) : (
            filtered.map((c) => {
              const open = openId === c.id;
              const mc = c.mode_classification;
              return (
                <div key={c.id} id={c.id} className="card">
                  <button
                    onClick={() => setOpenId(open ? null : c.id)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-ink-500 mb-2">
                      <span>
                        {c.domain || "uncategorized"} · {formatRelative(c.created_at)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {c.threshold_triggered && (
                          <span className="normal-case text-[10px] text-ink-500">
                            ◉ threshold triggered
                          </span>
                        )}
                        {mc && (
                          <span
                            className={`normal-case tracking-normal text-[10px] font-semibold rounded-full border px-2 py-0.5 ${MODE_COLOR[mc]}`}
                          >
                            {mc}
                          </span>
                        )}
                        {c.was_correct_mode === false && (
                          <span className="normal-case text-[10px] text-red-600">
                            wrong mode
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-ink-900 leading-snug">{c.situation_text}</p>
                    {c.a_intention && (
                      <div className="mt-3 flex flex-col gap-1 text-xs text-ink-600">
                        <span>
                          <b className="text-emerald-700">A</b> {c.a_intention}
                        </span>
                        <span>
                          <b className="text-amber-700">B</b> {c.b_intention}
                        </span>
                      </div>
                    )}
                  </button>

                  {open && (
                    <div className="border-t border-ink-100 p-5 space-y-4">
                      {c.threshold_description && (
                        <div>
                          <div className="h-section mb-1">Threshold</div>
                          <p className="text-sm text-ink-800">{c.threshold_description}</p>
                        </div>
                      )}
                      {c.recommendation && (
                        <div>
                          <div className="h-section mb-1">Recommendation</div>
                          <p className="text-sm text-ink-800">{c.recommendation}</p>
                        </div>
                      )}

                      <div>
                        <div className="label">Outcome</div>
                        <div className="flex flex-wrap gap-2">
                          {OUTCOMES.map((o) => (
                            <button
                              key={o.value}
                              onClick={() =>
                                update(c.id, {
                                  outcome_status:
                                    c.outcome_status === o.value ? null : o.value,
                                })
                              }
                              className={
                                c.outcome_status === o.value
                                  ? "chip-active"
                                  : "chip hover:border-ink-400"
                              }
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="label">Reflection</div>
                        <textarea
                          defaultValue={c.reflection_note ?? ""}
                          onBlur={(e) =>
                            e.target.value !== (c.reflection_note ?? "") &&
                            update(c.id, { reflection_note: e.target.value || null })
                          }
                          placeholder="One sentence on what actually happened."
                          className="input resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            if (confirm("Delete this capture?")) store.remove(c.id);
                          }}
                          className="text-xs text-ink-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

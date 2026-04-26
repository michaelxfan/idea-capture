import type { DaySummary } from "@/lib/analysis";

const DAY_LABEL: Record<string, string> = {
  advance_dominant: "Advance-Dominant",
  stabilize_dominant: "Stabilize-Dominant",
  recovery_dominant: "Recovery-Dominant",
  mixed: "Mixed",
};

export default function DailySummaryCard({ summary }: { summary: DaySummary }) {
  return (
    <div className="card p-5 mb-6">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <div className="h-section mb-1">Day type</div>
          <div className="font-serif text-lg text-ink-900">{DAY_LABEL[summary.day_type]}</div>
        </div>
        <div>
          <div className="h-section mb-1">Dominant intent</div>
          <div className="font-serif text-lg text-ink-900">{summary.dominant_intent ?? "—"}</div>
        </div>
      </div>
      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-1">
            Key win
          </div>
          <p className="text-sm text-ink-800 leading-snug">
            {summary.key_win ?? "No wins captured yet."}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
            Key mistake
          </div>
          <p className="text-sm text-ink-800 leading-snug">
            {summary.key_mistake ?? "Nothing flagged as a mistake."}
          </p>
        </div>
      </div>
    </div>
  );
}

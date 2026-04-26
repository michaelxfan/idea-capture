import type { Interpretation } from "@/lib/ai/schema";

const MODE_STYLES: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-800 border-emerald-200",
  B: "bg-amber-50 text-amber-800 border-amber-200",
  mixed: "bg-ink-100 text-ink-700 border-ink-200",
  unclear: "bg-ink-50 text-ink-600 border-ink-200",
};

const B_CLASS_COPY: Record<string, string> = {
  strategic: "Strategic B — this fallback is advancing something real.",
  protective: "Protective B — this fallback is guarding something worth guarding.",
  healthy: "Healthy B — this is legitimate recovery, not avoidance.",
  avoidant: "Avoidant B — this fallback is mostly discomfort-dodging.",
  mixed: "Mixed B — partly strategic, partly avoidant.",
  unclear: "B classification unclear — not enough signal yet.",
};

export default function InterpretationCard({ interp }: { interp: Interpretation }) {
  return (
    <div className="card p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-section mb-1">Interpretation</div>
          <p className="text-ink-500 text-sm">{interp.evidence}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${MODE_STYLES[interp.current_mode]}`}
        >
          Mode: {interp.current_mode}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-700 font-semibold mb-2">
            A · stated
          </div>
          <p className="text-ink-900 leading-snug">{interp.a_intention}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-amber-700 font-semibold mb-2">
            B · fallback
          </div>
          <p className="text-ink-900 leading-snug">{interp.b_intention}</p>
        </div>
      </div>

      <div className="rounded-xl bg-ink-50 border border-ink-100 p-5">
        <div className="h-section mb-1">Threshold · {interp.threshold_type.replace("_", " ")}</div>
        <p className="text-ink-800 leading-snug">{interp.threshold_description}</p>
      </div>

      <p className="text-sm text-ink-600 italic">{B_CLASS_COPY[interp.b_classification]}</p>

      <div className="border-t border-ink-100 pt-5 space-y-3">
        <div>
          <div className="h-section mb-1">Next action</div>
          <p className="text-ink-900 font-medium leading-snug">{interp.recommendation}</p>
        </div>
        <div>
          <div className="h-section mb-1">Minimum viable A</div>
          <p className="text-ink-700 leading-snug">{interp.minimum_viable_a}</p>
        </div>
      </div>
    </div>
  );
}

import type { DayClassification, DayContext } from "@/lib/analysis";

const COPY: Record<string, { label: string; subtext: string; accent: string }> = {
  advance_dominant: {
    label: "Advance-Dominant",
    subtext: "Push A. Guard focus. Minimum viable A is the floor, not the goal.",
    accent: "from-emerald-50 to-paper border-emerald-200",
  },
  stabilize_dominant: {
    label: "Stabilize-Dominant",
    subtext: "Constrain A. Focus on structured B. Avoid drift.",
    accent: "from-amber-50 to-paper border-amber-200",
  },
  recovery_dominant: {
    label: "Recovery-Dominant",
    subtext: "Advance attempts will cost more than they return. Protect the system.",
    accent: "from-sky-50 to-paper border-sky-200",
  },
  mixed: {
    label: "Mixed",
    subtext: "Signal is split. Capture the next situation before you act on it.",
    accent: "from-ink-50 to-paper border-ink-200",
  },
};

const TIME_CONTEXT: Record<string, string> = {
  morning:   "Peak window — protect this time.",
  midday:    "Transitioning. Watch for early drift.",
  afternoon: "Energy dip. Structure beats heroics.",
  evening:   "Momentum mode. Good for execution and creative.",
  night:     "Wind-down. Capture, don't push.",
};

export default function TodayModeCard({
  classification,
  dayContext,
}: {
  classification: DayClassification;
  dayContext?: DayContext | null;
}) {
  const c = COPY[classification.day_type];
  const conf = Math.round(classification.confidence * 100);
  const timeHint = dayContext ? TIME_CONTEXT[dayContext.timeOfDay] : null;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-6 ${c.accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="h-section">Today&apos;s mode</div>
        {conf > 0 && (
          <span className="text-[10px] text-ink-500 tabular-nums">{conf}% confident</span>
        )}
      </div>
      <div className="mt-2 font-serif text-2xl md:text-3xl tracking-tight text-ink-900">
        {c.label}
      </div>
      <p className="mt-2 text-ink-700 leading-snug">{c.subtext}</p>
      {classification.reasoning && (
        <p className="mt-3 text-xs text-ink-500 leading-relaxed">{classification.reasoning}</p>
      )}
      {timeHint && (
        <p className="mt-2 text-xs text-ink-400 italic">{timeHint}</p>
      )}
    </div>
  );
}

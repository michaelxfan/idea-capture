import type { ThresholdPatterns } from "@/lib/analysis";

const LABEL: Record<string, string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export default function ThresholdTimeline({ patterns }: { patterns: ThresholdPatterns }) {
  return (
    <div className="card p-5">
      <div className="h-section mb-3">Threshold shifts</div>
      {patterns.timeline.length === 0 ? (
        <p className="text-sm text-ink-400">Not enough captures to map the timeline.</p>
      ) : (
        <ol className="space-y-3">
          {patterns.timeline.map((t) => (
            <li key={t.period} className="flex items-center gap-3">
              <span className="w-20 text-xs text-ink-500 tabular-nums">{LABEL[t.period]}</span>
              <span className="h-px flex-1 bg-ink-200" />
              <span className="chip">
                {t.type ? t.type.replace("_", " ") : "—"}
                <span className="ml-1 text-ink-400">· {t.count}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-xs text-ink-500 leading-relaxed">{patterns.summary}</p>
    </div>
  );
}

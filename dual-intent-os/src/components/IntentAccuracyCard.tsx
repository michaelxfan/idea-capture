import type { IntentAccuracy, DriftReport } from "@/lib/analysis";

function riskLabel(score: number): { label: string; className: string } {
  if (score >= 60) return { label: "High", className: "text-red-700" };
  if (score >= 30) return { label: "Medium", className: "text-amber-700" };
  return { label: "Low", className: "text-emerald-700" };
}

export default function IntentAccuracyCard({
  accuracy,
  drift,
}: {
  accuracy: IntentAccuracy;
  drift: DriftReport;
}) {
  const risk = riskLabel(drift.drift_risk_score);
  return (
    <div className="card p-5">
      <div className="h-section mb-4">Intent accuracy</div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Metric label="Correct" value={`${accuracy.correct_intent_pct}%`} tone="emerald" />
        <Metric label="Mislabel" value={`${accuracy.mislabel_pct}%`} tone="amber" />
        <Metric label="Drift" value={`${accuracy.drift_pct}%`} tone="ink" />
      </div>
      <div className="text-xs text-ink-500 mb-2">
        Drift risk: <span className={`font-semibold ${risk.className}`}>{risk.label}</span>
      </div>
      {accuracy.notes.length > 0 && (
        <ul className="space-y-1.5 text-xs text-ink-600">
          {accuracy.notes.map((n, i) => (
            <li key={i}>· {n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "ink";
}) {
  const toneClass =
    tone === "emerald" ? "text-emerald-800" : tone === "amber" ? "text-amber-800" : "text-ink-800";
  return (
    <div className="rounded-xl border border-ink-100 bg-paper px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`font-serif text-xl tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

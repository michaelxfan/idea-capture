import type { Capture } from "@/types";

export default function DailyCoachCard({ captures }: { captures: Capture[] }) {
  const recent = captures.slice(0, 10);
  const inB = recent.filter((c) => c.current_mode === "B").length;
  const inA = recent.filter((c) => c.current_mode === "A").length;
  const avoidant = recent.filter((c) => c.b_classification === "avoidant").length;

  let line = "Nothing captured yet today. The cheapest next step is a twenty-second capture.";
  if (recent.length >= 2) {
    if (avoidant >= 2) {
      line = `You've drifted into avoidant B ${avoidant} times recently. The pattern isn't laziness — it's the threshold. Name it and lower the bar on A.`;
    } else if (inB > inA && inB >= 2) {
      line = `Fallback mode is winning today (${inB} vs ${inA}). Not necessarily wrong — but worth a minimum viable A on the next one.`;
    } else if (inA > inB) {
      line = `Holding A on ${inA} of ${recent.length}. Don't audit the wins — keep going.`;
    } else {
      line = `Split day. Your threshold is doing more work than your willpower. Capture the next situation before you act on it.`;
    }
  }

  return (
    <div className="card p-6 bg-ink-900 text-paper border-ink-900">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-300 mb-3">Coach</div>
      <p className="font-serif text-lg leading-snug">{line}</p>
    </div>
  );
}

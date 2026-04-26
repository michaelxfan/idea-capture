export default function PatternInsightsCard({ insights }: { insights: string[] }) {
  return (
    <div className="card p-5">
      <div className="h-section mb-3">Pattern insights</div>
      <ul className="space-y-2.5">
        {insights.map((text, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-ink-800 leading-snug">
            <span className="text-ink-300 select-none">—</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

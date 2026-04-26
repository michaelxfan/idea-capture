export default function PatternCard({
  title,
  items,
  emptyLabel = "Not enough data yet.",
}: {
  title: string;
  items: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  const max = items.reduce((m, x) => Math.max(m, x.count), 0);
  return (
    <div className="card p-5">
      <div className="h-section mb-4">{title}</div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-ink-800 truncate pr-3">{it.label}</span>
                <span className="text-ink-400 tabular-nums">{it.count}</span>
              </div>
              <div className="h-1 rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full bg-ink-700"
                  style={{ width: `${max ? (it.count / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

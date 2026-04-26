export default function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

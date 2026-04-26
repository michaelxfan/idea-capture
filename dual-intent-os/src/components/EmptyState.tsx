export default function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="card p-8 text-center">
      <p className="font-serif text-xl text-ink-900 mb-2">{title}</p>
      {body && <p className="text-sm text-ink-500 max-w-md mx-auto">{body}</p>}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

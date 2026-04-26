import Link from "next/link";

export default function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card p-8 text-center">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {body ? <p className="text-sm text-[var(--text-secondary)] mt-1">{body}</p> : null}
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="btn btn-primary mt-4 inline-flex">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-10 text-center">
      <h1 className="font-display text-2xl font-semibold">Not found</h1>
      <p className="text-[var(--text-secondary)] mt-2">That stakeholder or page doesn't exist.</p>
      <Link href="/" className="btn btn-primary mt-4 inline-flex">Back to dashboard</Link>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 md:py-32">
      <div className="mb-3 h-section">Dual Intent OS</div>
      <h1 className="h-display mb-6 leading-[1.1]">
        What you say you want.<br />
        <span className="text-ink-500">What you actually optimize for under pressure.</span>
      </h1>
      <p className="text-ink-600 text-lg leading-relaxed mb-10 max-w-xl">
        A second brain for operators. Capture a situation in under twenty seconds.
        Dual Intent OS interprets your stated intention, your fallback intention,
        and the exact threshold where one becomes the other — then gives you one
        sharp next action.
      </p>

      <div className="flex gap-3">
        <Link href="/dashboard" className="btn-primary">Open dashboard</Link>
        <Link href="/capture" className="btn-secondary">+ New capture</Link>
      </div>

      <div className="mt-20 space-y-4 text-sm text-ink-500 leading-relaxed max-w-lg">
        <p><span className="text-ink-800 font-medium">A intention.</span> The stated, ideal, higher-order version of what you want.</p>
        <p><span className="text-ink-800 font-medium">B intention.</span> The fallback. Sometimes strategic. Sometimes avoidant. Not automatically worse.</p>
        <p><span className="text-ink-800 font-medium">Threshold.</span> The condition — not the clock — where you switch.</p>
      </div>
    </main>
  );
}

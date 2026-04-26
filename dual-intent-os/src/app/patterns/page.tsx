"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import PatternCard from "@/components/PatternCard";
import EmptyState from "@/components/EmptyState";
import { useCaptures } from "@/lib/useStore";
import type { Capture } from "@/types";

function tally<T extends string | null | undefined>(xs: T[]) {
  const map = new Map<string, number>();
  for (const x of xs) {
    if (!x) continue;
    map.set(x, (map.get(x) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function normalize(s: string | null | undefined) {
  if (!s) return null;
  return s.toLowerCase().replace(/[.!?,;:]+$/g, "").trim();
}

export default function PatternsPage() {
  const { captures, hydrated } = useCaptures();

  if (!hydrated) {
    return (
      <AppShell>
        <div className="card p-8 text-sm text-ink-400">Loading…</div>
      </AppShell>
    );
  }

  if (captures.length < 3) {
    return (
      <AppShell>
        <div className="mb-8">
          <div className="h-section mb-1">Patterns</div>
          <h1 className="h-display">What's repeating.</h1>
        </div>
        <EmptyState
          title="Patterns appear after ~3 captures."
          body="Dual Intent OS looks for recurring thresholds, domains with conflict, and fallback types that keep showing up."
          cta={<Link href="/capture" className="btn-primary">+ Capture a situation</Link>}
        />
      </AppShell>
    );
  }

  const aIntents = tally(captures.map((c) => normalize(c.a_intention)));
  const bIntents = tally(captures.map((c) => normalize(c.b_intention)));
  const thresholds = tally(captures.map((c) => c.threshold_type ?? null));
  const bClasses = tally(captures.map((c) => c.b_classification ?? null));
  const conflictDomains = tally(
    captures.filter((c) => c.current_mode === "B").map((c) => c.domain ?? null)
  );
  // TODO: replace text normalization with embedding-based clustering for A→B pair matching.
  const pairs = tally(
    captures.map((c: Capture) =>
      c.a_intention && c.b_intention
        ? `${normalize(c.a_intention)} → ${normalize(c.b_intention)}`
        : null
    )
  );

  return (
    <AppShell>
      <div className="mb-8">
        <div className="h-section mb-1">Patterns</div>
        <h1 className="h-display">What's repeating.</h1>
        <p className="text-ink-500 mt-2 text-sm">
          Based on your last {captures.length} captures.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <PatternCard title="Most common A intentions" items={aIntents} />
        <PatternCard title="Most common B intentions" items={bIntents} />
        <PatternCard title="Most common thresholds" items={thresholds} />
        <PatternCard title="B classifications" items={bClasses} />
        <PatternCard title="Domains where B wins" items={conflictDomains} />
        <PatternCard title="Recurring A→B pairings" items={pairs} />
      </div>

      <div className="mt-8 card p-5 text-sm text-ink-500">
        Regret-prone patterns · coming soon. Once you mark outcomes, Dual Intent OS will
        surface the specific A→B switches you tend to regret.
      </div>
    </AppShell>
  );
}

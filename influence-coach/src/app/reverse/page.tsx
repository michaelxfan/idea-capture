import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import { getGoals, getReverse, listStakeholders } from "@/lib/db";
import { priorityScore } from "@/lib/score";
import { RelationshipChip } from "@/components/Chips";
import { MY_ROLE } from "@/lib/config";
import type { OfferPriority } from "@/lib/types";

export const dynamic = "force-dynamic";

const PRIORITY_CLASS: Record<OfferPriority, string> = {
  high: "chip-danger",
  medium: "chip-warn",
  low: "chip",
};

export default async function ReverseModePage() {
  const stakeholders = await listStakeholders();
  if (stakeholders.length === 0) {
    return (
      <EmptyState
        title="Nothing to show yet"
        body="Add stakeholders first, then come back to see what you can do for each of them."
        ctaHref="/stakeholders"
        ctaLabel="Go to stakeholders"
      />
    );
  }

  const rows = await Promise.all(
    stakeholders.map(async (s) => {
      const [g, r] = await Promise.all([getGoals(s.id), getReverse(s.id)]);
      return { s, g, r, score: priorityScore(s, g ?? undefined) };
    })
  );
  rows.sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reverse Value — what I can do for them"
        subtitle={`Flip the equation. For each stakeholder, what does my role (${MY_ROLE}) offer them?`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map(({ s, r }) => (
          <Link key={s.id} href={`/stakeholders/${s.id}?tab=reverse`} className="card p-4 hover:border-[var(--text-primary)] transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-base font-semibold">{s.name}</div>
                <div className="text-sm text-[var(--text-secondary)]">{s.title}</div>
              </div>
              <div className="flex gap-2 items-center">
                {r?.offerPriority && (
                  <span className={`chip capitalize ${PRIORITY_CLASS[r.offerPriority]}`}>
                    {r.offerPriority} priority
                  </span>
                )}
                <RelationshipChip r={s.relationshipStrength} />
              </div>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <ReverseLine label="How I help them" value={r?.howIHelpThem} />
              <ReverseLine label="What I offer" value={r?.whatIOffer} />
              <ReverseLine label="Trade opportunities" value={r?.tradeOpportunities} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReverseLine({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">{label}</div>
      <div className={value ? "" : "text-[var(--text-tertiary)] italic"}>
        {value || "Not defined yet — click in to add."}
      </div>
    </div>
  );
}

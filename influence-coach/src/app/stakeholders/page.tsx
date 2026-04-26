import Link from "next/link";
import { getGoals, listStakeholders } from "@/lib/db";
import { priorityScore, daysUntilDeadline, deadlineUrgencyClass } from "@/lib/score";
import { RelationshipChip, ScoreDots, OfficeBadge, StatusChip } from "@/components/Chips";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import NewStakeholder from "./NewStakeholder";

export const dynamic = "force-dynamic";

export default async function StakeholdersPage() {
  const stakeholders = await listStakeholders();
  const rows = await Promise.all(
    stakeholders.map(async (s) => {
      const g = await getGoals(s.id);
      return { s, g, score: priorityScore(s, g ?? undefined) };
    })
  );
  rows.sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stakeholders"
        subtitle="Ranked by influence × priority × relationship leverage"
        right={<NewStakeholder />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No stakeholders tracked yet"
          body="Add one manually or upload your org chart."
          ctaHref="/upload"
          ctaLabel="Upload org chart"
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] bg-[var(--surface-alt)]">
              <tr>
                <th className="text-left py-2 px-4 font-medium">Name</th>
                <th className="text-left py-2 px-4 font-medium hidden md:table-cell">Title · Team</th>
                <th className="text-left py-2 px-4 font-medium">Influence</th>
                <th className="text-left py-2 px-4 font-medium hidden sm:table-cell">Relationship</th>
                <th className="text-left py-2 px-4 font-medium hidden lg:table-cell">1m Ask</th>
                <th className="text-left py-2 px-4 font-medium hidden sm:table-cell">Status</th>
                <th className="text-left py-2 px-4 font-medium hidden md:table-cell">Deadline</th>
                <th className="text-right py-2 px-4 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, g, score }) => {
                const days = daysUntilDeadline(g ?? undefined);
                const urgency = deadlineUrgencyClass(days);
                const rowBg =
                  days !== null && days <= 7
                    ? "bg-red-50"
                    : days !== null && days <= 30
                    ? "bg-amber-50"
                    : "";
                return (
                  <tr
                    key={s.id}
                    className={`border-t border-[var(--border-light)] hover:bg-[var(--surface-alt)] transition-colors ${rowBg}`}
                  >
                    <td className="py-3 px-4">
                      <Link href={`/stakeholders/${s.id}`} className="font-medium">
                        {s.name}
                      </Link>
                      <div className="mt-1"><OfficeBadge on={s.isInOffice} /></div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div>{s.title || <span className="text-[var(--text-tertiary)]">—</span>}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{s.team}</div>
                    </td>
                    <td className="py-3 px-4"><ScoreDots score={s.influenceScore} /></td>
                    <td className="py-3 px-4 hidden sm:table-cell"><RelationshipChip r={s.relationshipStrength} /></td>
                    <td className="py-3 px-4 hidden lg:table-cell max-w-[260px]">
                      {g?.goal1m ? (
                        <div className="truncate" title={g.goal1m}>{g.goal1m}</div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {g?.status ? <StatusChip status={g.status} /> : <span className="text-[var(--text-tertiary)]">—</span>}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {days !== null ? (
                        <span className={`text-xs font-medium ${urgency}`}>
                          {days <= 0 ? "Overdue" : `${days}d`}
                        </span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-display font-semibold">{score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

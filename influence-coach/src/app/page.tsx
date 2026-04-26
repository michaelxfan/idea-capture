import Link from "next/link";
import { listStakeholders, getGoals, listRecentInsights } from "@/lib/db";
import { priorityScore, leverageScore, daysUntilDeadline, deadlineUrgencyClass } from "@/lib/score";
import { MY_ROLE } from "@/lib/config";
import { RelationshipChip, ScoreDots, OfficeBadge, StatusChip } from "@/components/Chips";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import SeedButton from "./SeedButton";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const stakeholders = await listStakeholders();

  const withGoals = await Promise.all(
    stakeholders.map(async (s) => {
      const g = await getGoals(s.id);
      return { s, g };
    })
  );

  const allForLeverage = withGoals.map(({ s, g }) => ({ s, g: g ?? undefined }));

  const ranked = [...withGoals]
    .map(({ s, g }) => ({
      s,
      g,
      score: priorityScore(s, g ?? undefined),
      lev: leverageScore(s, g ?? undefined, allForLeverage),
    }))
    .sort((a, b) => b.score - a.score);

  const topPriorities = ranked.slice(0, 4);
  const blocked = withGoals.filter((x) => x.g?.status === "blocked");
  const inOffice = stakeholders.filter((s) => s.isInOffice);
  const recentInsights = await listRecentInsights(3);

  const allies = withGoals.filter(
    (x) => x.s.relationshipStrength === "aligned" || x.s.relationshipStrength === "sponsor"
  );

  if (stakeholders.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="No stakeholders yet"
          body="Seed the example stakeholders or upload your org chart to get started."
          ctaHref="/upload"
          ctaLabel="Upload an org chart"
        />
        <div className="card p-6">
          <div className="text-sm text-[var(--text-secondary)] mb-3">
            Or start with the example dataset ({MY_ROLE}).
          </div>
          <SeedButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          title="Today's influence picture"
          subtitle={`${MY_ROLE} · ${stakeholders.length} stakeholders tracked`}
          right={
            <Link href="/stakeholders" className="btn btn-ghost">
              View all →
            </Link>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Top priority" value={topPriorities[0]?.s.name ?? "—"} />
          <Stat label="Top leverage" value={topPriorities.sort((a, b) => b.lev - a.lev)[0]?.s.name ?? "—"} sub="most downstream unblocks" />
          <Stat label="Blocked asks" value={String(blocked.length)} />
          <Stat label="Aligned allies" value={String(allies.length)} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Top priority stakeholders"
          subtitle="Ranked by influence × goal priority × relationship leverage"
          right={
            <Link href="/influence-map" className="btn btn-ghost">
              Open influence map →
            </Link>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...ranked].sort((a, b) => b.score - a.score).slice(0, 4).map(({ s, g, score, lev }) => {
            const days = daysUntilDeadline(g ?? undefined);
            const urgency = deadlineUrgencyClass(days);
            return (
              <Link
                key={s.id}
                href={`/stakeholders/${s.id}`}
                className="card p-4 hover:border-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-base font-semibold">{s.name}</div>
                    <div className="text-sm text-[var(--text-secondary)]">{s.title}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-[var(--text-tertiary)]">Priority · Leverage</div>
                    <div className="font-display text-lg font-semibold">
                      {score}
                      <span className="text-sm font-normal text-[var(--text-tertiary)] ml-1">/ {lev}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <ScoreDots score={s.influenceScore} />
                  <RelationshipChip r={s.relationshipStrength} />
                  <OfficeBadge on={s.isInOffice} />
                  {g?.status ? <StatusChip status={g.status} /> : null}
                </div>
                {g?.goal1m ? (
                  <div className="mt-3 text-sm">
                    <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide mr-2">1m ask</span>
                    {g.goal1m}
                  </div>
                ) : null}
                {days !== null && (
                  <div className={`mt-1 text-xs ${urgency}`}>
                    Decision deadline: {days <= 0 ? "overdue" : `${days}d`}
                    {g?.compoundingRiskDays ? ` · risk compounds in ${g.compoundingRiskDays}d` : ""}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Alignment council */}
      {allies.length > 0 && (
        <section>
          <SectionHeader
            title="Alignment council"
            subtitle="Allies who could advocate for you — click to draft an enlistment message"
          />
          <DashboardClient allies={allies.map(({ s, g }) => ({ s, g: g ?? undefined }))} blocked={blocked.map(({ s, g }) => ({ s, g: g ?? undefined }))} />
        </section>
      )}

      {/* Blocker chain */}
      {blocked.length > 0 && (
        <section>
          <SectionHeader title="Blocked asks" subtitle="Where influence work matters most right now" />
          <ul className="space-y-2">
            {blocked.map(({ s, g }) => {
              const days = daysUntilDeadline(g ?? undefined);
              const urgency = deadlineUrgencyClass(days);
              const downstream = stakeholders.filter(
                (other) => other.influences.includes(s.id)
              );
              return (
                <li key={s.id} className="card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{g?.goal1m || g?.goal3m}</div>
                      {g?.blockers ? (
                        <div className="text-xs mt-1 text-[var(--danger)]">Blocker: {g.blockers}</div>
                      ) : null}
                      {days !== null && (
                        <div className={`text-xs mt-0.5 ${urgency}`}>
                          Decision in {days <= 0 ? "overdue" : `${days}d`}
                        </div>
                      )}
                      {downstream.length > 0 && (
                        <div className="text-xs mt-1.5 text-[var(--text-tertiary)]">
                          Unblocking this also advances:{" "}
                          {downstream.map((d) => (
                            <Link key={d.id} href={`/stakeholders/${d.id}`} className="underline mr-1">{d.name}</Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link href={`/stakeholders/${s.id}`} className="btn btn-ghost shrink-0">
                      Work on it →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <SectionHeader
          title="In office today"
          subtitle="People to catch in person — influence opportunity"
          right={
            <Link href="/in-person" className="btn">
              Get today's conversation plan →
            </Link>
          }
        />
        {inOffice.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No one marked as in office. Toggle it on a stakeholder's detail page.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {inOffice.map((s) => (
              <Link key={s.id} href={`/stakeholders/${s.id}`} className="chip chip-brand">
                {s.name} · {s.title.split(",")[0]}
              </Link>
            ))}
          </div>
        )}
      </section>

      {recentInsights.length > 0 ? (
        <section>
          <SectionHeader title="Recent AI recommendations" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentInsights.map((ins) => {
              const s = stakeholders.find((x) => x.id === ins.stakeholderId);
              if (!s) return null;
              return (
                <Link key={ins.id} href={`/stakeholders/${s.id}`} className="card p-4">
                  <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                    Next best action
                  </div>
                  <div className="font-medium mt-1">{s.name}</div>
                  <div className="text-sm text-[var(--text-secondary)] mt-2">{ins.nextBestAction}</div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">{label}</div>
      <div className="font-display text-lg font-semibold mt-1 truncate">{value}</div>
      {sub && <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</div>}
    </div>
  );
}

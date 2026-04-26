import { listStakeholders, getGoals } from "@/lib/db";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import InfluenceMapClient from "./InfluenceMapClient";

export const dynamic = "force-dynamic";

export default async function InfluenceMapPage() {
  const stakeholders = await listStakeholders();
  if (stakeholders.length === 0) {
    return (
      <EmptyState
        title="No stakeholders yet"
        body="Add stakeholders to visualize the influence network."
        ctaHref="/stakeholders"
        ctaLabel="Go to stakeholders"
      />
    );
  }

  const withGoals = await Promise.all(
    stakeholders.map(async (s) => {
      const g = await getGoals(s.id);
      return { stakeholder: s, goals: g };
    })
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Influence Map"
        subtitle="Network of stakeholder relationships — node size = influence score, color = relationship strength. Click any node to open their profile."
      />
      <InfluenceMapClient data={withGoals} />
    </div>
  );
}

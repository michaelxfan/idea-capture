import { notFound } from "next/navigation";
import Link from "next/link";
import { getGoals, getLatestInsights, getReverse, getStakeholder, getDependencies, getLatestGapAnalysis } from "@/lib/db";
import StakeholderDetail from "./StakeholderDetail";

export const dynamic = "force-dynamic";

export default async function StakeholderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [stakeholder, goals, reverse, insights, dependencies, gapAnalysis] = await Promise.all([
    getStakeholder(id),
    getGoals(id),
    getReverse(id),
    getLatestInsights(id),
    getDependencies(id),
    getLatestGapAnalysis(id),
  ]);
  if (!stakeholder) notFound();

  return (
    <div className="space-y-6">
      <Link href="/stakeholders" className="text-sm text-[var(--text-secondary)] link">
        ← All stakeholders
      </Link>
      <StakeholderDetail
        stakeholder={stakeholder}
        initialGoals={goals}
        initialReverse={reverse}
        initialInsights={insights}
        initialDependencies={dependencies}
        initialGapAnalysis={gapAnalysis}
      />
    </div>
  );
}

import { listLedger, listStakeholders } from "@/lib/db";
import SectionHeader from "@/components/SectionHeader";
import LedgerClient from "./LedgerClient";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const [entries, stakeholders] = await Promise.all([listLedger(), listStakeholders()]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Relationship Ledger"
        subtitle="Track favors given and received — surfaces when the relationship is out of balance."
      />
      <LedgerClient entries={entries} stakeholders={stakeholders} />
    </div>
  );
}

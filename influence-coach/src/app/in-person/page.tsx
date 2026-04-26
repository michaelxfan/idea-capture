import SectionHeader from "@/components/SectionHeader";
import InPersonClient from "./InPersonClient";
import { listStakeholders } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InPersonPage() {
  const all = await listStakeholders();
  const inOffice = all.filter((s) => s.isInOffice);
  return (
    <div className="space-y-5">
      <SectionHeader
        title="In office today"
        subtitle="Who's here, what to say, what to leave them with."
      />
      <InPersonClient all={all} inOfficeCount={inOffice.length} />
    </div>
  );
}

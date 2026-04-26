import UploadFlow from "./UploadFlow";
import SectionHeader from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Upload org chart"
        subtitle="Claude vision will try to extract names and titles. You can always edit before saving."
      />
      <UploadFlow />
    </div>
  );
}

import AppShell from "@/components/AppShell";
import ReviewClient from "./ReviewClient";

export default function ReviewPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <div className="h-section mb-1">Review</div>
        <h1 className="h-display">History & reflection.</h1>
      </div>
      <ReviewClient />
    </AppShell>
  );
}

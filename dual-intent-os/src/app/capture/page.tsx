import AppShell from "@/components/AppShell";
import CaptureForm from "@/components/CaptureForm";

export default function CapturePage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="h-section mb-1">Capture</div>
          <h1 className="h-display">What's actually going on.</h1>
          <p className="text-ink-500 mt-2 text-sm">
            Write it the way you'd say it out loud. Structured fields are optional.
          </p>
        </div>
        <CaptureForm />
      </div>
    </AppShell>
  );
}

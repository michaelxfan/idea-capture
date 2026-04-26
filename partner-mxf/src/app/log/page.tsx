"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card, { SectionLabel } from "@/components/Card";
import type { ReplyConsistency, GuiltFlag } from "@/lib/types";

const GUILT_OPTIONS: { id: GuiltFlag; label: string }[] = [
  { id: "guilt", label: "Felt guilty" },
  { id: "avoidance", label: "Avoided reaching out" },
  { id: "could-do-better", label: "Could've done better" },
  { id: "felt-distant", label: "Felt distant" },
  { id: "was-short", label: "Was short with them" },
];

type YesNo = "yes" | "no";
type YesSomewhatNo = "yes" | "somewhat" | "no";

function ToggleGroup<T extends string>({
  value, onChange, options,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex-1 h-12 rounded-xl text-sm font-medium border transition-colors ${
            value === o.value ? "bg-ink text-surface border-ink" : "bg-surface text-ink border-border"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const REQUIRED_FIELDS = [
  { key: "replied", label: "Reply consistency" },
  { key: "initiated", label: "Initiated contact" },
  { key: "meaningful", label: "Meaningful connection" },
  { key: "operatorMode", label: "Operator mode" },
] as const;

export default function LogPage() {
  const router = useRouter();
  const [replied, setReplied] = useState<YesSomewhatNo | null>(null);
  const [initiated, setInitiated] = useState<YesNo | null>(null);
  const [meaningful, setMeaningful] = useState<YesNo | null>(null);
  const [guiltFlags, setGuiltFlags] = useState<GuiltFlag[]>([]);
  const [operatorMode, setOperatorMode] = useState<YesNo | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fieldValues: Record<string, unknown> = { replied, initiated, meaningful, operatorMode };
  const answered = REQUIRED_FIELDS.filter((f) => fieldValues[f.key] !== null).length;
  const remaining = REQUIRED_FIELDS.length - answered;
  const canSave = remaining === 0;

  const toggleGuilt = (flag: GuiltFlag) => {
    setGuiltFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_date: today,
          replied_consistently: replied,
          initiated_contact: initiated === "yes",
          meaningful_connection: meaningful === "yes",
          guilt_flags: guiltFlags,
          operator_mode: operatorMode === "yes",
          notes: notes.trim() || null,
        }),
      });
      setSaved(true);
      setTimeout(() => router.push("/"), 800);
    } catch {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-solid-bg flex items-center justify-center mb-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3A6348" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-ink">Logged.</p>
        <p className="text-sm text-ink-muted">Updating your drift score…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Quick Log</p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Today&apos;s Check-in</h1>
        <p className="text-sm text-ink-muted mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-surface-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-ink rounded-full transition-all duration-300"
            style={{ width: `${(answered / REQUIRED_FIELDS.length) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-subtle whitespace-nowrap">
          {remaining === 0 ? "All done" : `${remaining} left`}
        </p>
      </div>

      <div className="space-y-4">
        {/* Reply consistency */}
        <Card className={replied === null ? "ring-1 ring-border-subtle" : ""}>
          <SectionLabel>
            Did I reply consistently today?
            {replied === null && <span className="ml-2 text-friction opacity-60">Required</span>}
          </SectionLabel>
          <ToggleGroup<YesSomewhatNo>
            value={replied} onChange={setReplied}
            options={[
              { value: "yes", label: "Yes" },
              { value: "somewhat", label: "Somewhat" },
              { value: "no", label: "No" },
            ]}
          />
        </Card>

        {/* Initiated contact */}
        <Card className={initiated === null ? "ring-1 ring-border-subtle" : ""}>
          <SectionLabel>
            Did I initiate contact?
            {initiated === null && <span className="ml-2 text-friction opacity-60">Required</span>}
          </SectionLabel>
          <ToggleGroup<YesNo>
            value={initiated} onChange={setInitiated}
            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
          />
        </Card>

        {/* Meaningful connection */}
        <Card className={meaningful === null ? "ring-1 ring-border-subtle" : ""}>
          <SectionLabel>
            Did we have meaningful connection?
            {meaningful === null && <span className="ml-2 text-friction opacity-60">Required</span>}
          </SectionLabel>
          <ToggleGroup<YesNo>
            value={meaningful} onChange={setMeaningful}
            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
          />
        </Card>

        {/* Guilt flags */}
        <Card>
          <SectionLabel>Any signals? (optional)</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {GUILT_OPTIONS.map((o) => (
              <button key={o.id} onClick={() => toggleGuilt(o.id)}
                className={`h-10 px-4 rounded-full text-sm border transition-colors ${
                  guiltFlags.includes(o.id) ? "bg-ink text-surface border-ink" : "bg-surface text-ink border-border"
                }`}>
                {o.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Operator mode */}
        <Card className={operatorMode === null ? "ring-1 ring-border-subtle" : ""}>
          <SectionLabel>
            Was I mostly in Operator Mode?
            {operatorMode === null && <span className="ml-2 text-friction opacity-60">Required</span>}
          </SectionLabel>
          <ToggleGroup<YesNo>
            value={operatorMode} onChange={setOperatorMode}
            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
          />
          <p className="text-[11px] text-ink-subtle mt-2">Head-down, task-focused, low relational presence.</p>
        </Card>

        {/* Notes */}
        <Card>
          <SectionLabel>Notes (optional)</SectionLabel>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Voice dictate or type anything relevant…" rows={3}
            className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border"
          />
        </Card>
      </div>

      <button onClick={handleSave} disabled={!canSave || saving}
        className={`w-full h-14 rounded-2xl text-base font-medium transition-all ${
          canSave ? "bg-ink text-surface" : "bg-surface-subtle text-ink-subtle border border-border"
        }`}>
        {saving ? "Saving…" : canSave ? "Save Log" : `Answer ${remaining} more question${remaining === 1 ? "" : "s"} to save`}
      </button>
    </div>
  );
}

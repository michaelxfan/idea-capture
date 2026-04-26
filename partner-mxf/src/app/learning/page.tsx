"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card, { SectionLabel } from "@/components/Card";
import type { DriftLevel } from "@/lib/types";

type Landed = "yes" | "neutral" | "no";

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 h-12 rounded-xl text-sm font-medium border transition-colors ${
            value === o.value
              ? "bg-ink text-surface border-ink"
              : "bg-surface text-ink border-border"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function LearningPage() {
  const router = useRouter();
  const [driftLevel, setDriftLevel] = useState<DriftLevel | null>(null);
  const [messageUsed, setMessageUsed] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [landed, setLanded] = useState<Landed | null>(null);
  const [overdid, setOverdid] = useState<"yes" | "no" | null>(null);
  const [underdid, setUnderdid] = useState<"yes" | "no" | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canSave = driftLevel !== null && landed !== null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      await fetch("/api/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_date: today,
          drift_level: driftLevel,
          message_used: messageUsed.trim() || null,
          action_taken: actionTaken.trim() || null,
          landed,
          overdid: overdid === "yes",
          underdid: underdid === "yes",
          notes: notes.trim() || null,
        }),
      });
      setSaved(true);
      setTimeout(() => router.push("/history"), 900);
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
        <p className="text-sm text-ink-muted">This will improve future recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">
          Learning Loop
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          After the Repair
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Record what happened. Improves calibration over time.
        </p>
      </div>

      <div className="space-y-4">
        {/* Drift level at time of repair */}
        <Card>
          <SectionLabel>Drift Level at the Time</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {(["solid", "light-drift", "noticeable", "friction"] as DriftLevel[]).map((l) => (
              <button
                key={l}
                onClick={() => setDriftLevel(l)}
                className={`h-11 rounded-xl text-sm border transition-colors ${
                  driftLevel === l
                    ? "bg-ink text-surface border-ink"
                    : "bg-surface text-ink border-border"
                }`}
              >
                {l === "solid" && "Solid"}
                {l === "light-drift" && "Light Drift"}
                {l === "noticeable" && "Noticeable"}
                {l === "friction" && "Friction Risk"}
              </button>
            ))}
          </div>
        </Card>

        {/* Message used */}
        <Card>
          <SectionLabel>Message Used (optional)</SectionLabel>
          <textarea
            value={messageUsed}
            onChange={(e) => setMessageUsed(e.target.value)}
            placeholder="What did you say?"
            rows={2}
            className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border"
          />
        </Card>

        {/* Action taken */}
        <Card>
          <SectionLabel>Action Taken (optional)</SectionLabel>
          <input
            type="text"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="e.g. dinner, walk, voice note"
            className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-1 focus:ring-border"
          />
        </Card>

        {/* Did it land */}
        <Card>
          <SectionLabel>Did it land well?</SectionLabel>
          <ToggleGroup<Landed>
            value={landed}
            onChange={setLanded}
            options={[
              { value: "yes", label: "Yes" },
              { value: "neutral", label: "Neutral" },
              { value: "no", label: "No" },
            ]}
          />
        </Card>

        {/* Overdid / Underdid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <SectionLabel>Overdid it?</SectionLabel>
            <ToggleGroup<"yes" | "no">
              value={overdid}
              onChange={setOverdid}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </Card>
          <Card>
            <SectionLabel>Underdid it?</SectionLabel>
            <ToggleGroup<"yes" | "no">
              value={underdid}
              onChange={setUnderdid}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </Card>
        </div>

        {/* Notes */}
        <Card>
          <SectionLabel>What should I remember?</SectionLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, patterns, what worked or didn't…"
            rows={3}
            className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border"
          />
        </Card>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className={`w-full h-14 rounded-2xl text-base font-medium transition-all ${
          canSave
            ? "bg-ink text-surface"
            : "bg-surface-subtle text-ink-subtle border border-border"
        }`}
      >
        {saving ? "Saving…" : "Save Outcome"}
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import type { PartnerProfile, RepairStyle, CommSensitivity, GiftSensitivity, ConnectionFormat } from "@/lib/types";
import Card, { SectionLabel } from "@/components/Card";

function DataControls() {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const exportLogs = async () => {
    const res = await fetch("/api/logs?limit=500");
    const { logs } = await res.json();
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `partner-mxf-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAll = async () => {
    setDeleting(true);
    const res = await fetch("/api/logs?limit=500");
    const { logs } = await res.json();
    await Promise.all((logs ?? []).map((l: { id: string }) =>
      fetch(`/api/logs/${l.id}`, { method: "DELETE" })
    ));
    setDeleted(true);
    setConfirmDelete(false);
    setDeleting(false);
  };

  return (
    <div className="bg-surface-subtle border border-border-subtle rounded-2xl px-5 py-4 space-y-4">
      <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium">Data &amp; Privacy</p>
      <p className="text-xs text-ink-muted leading-relaxed">
        Your data is stored in a private Supabase database. Nothing is shared externally. Profile data is only used to improve Analyze recommendations.
      </p>
      <div className="space-y-2">
        <button onClick={exportLogs}
          className="w-full h-10 border border-border rounded-xl text-sm text-ink-muted font-medium hover:bg-surface transition-colors">
          Export Logs (JSON)
        </button>
        {deleted ? (
          <p className="text-sm text-solid text-center py-2">All logs deleted.</p>
        ) : confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)}
              className="flex-1 h-10 border border-border rounded-xl text-sm text-ink-subtle">
              Cancel
            </button>
            <button onClick={deleteAll} disabled={deleting}
              className="flex-1 h-10 border border-friction-border rounded-xl text-sm text-friction bg-friction-bg font-medium">
              {deleting ? "Deleting…" : "Confirm Delete All"}
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="w-full h-10 border border-border rounded-xl text-sm text-friction opacity-60 hover:opacity-100 transition-opacity font-medium">
            Delete All Logs
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Chips<T extends string>({
  value, onChange, options, multi = false,
}: {
  value: T | T[] | null;
  onChange: (v: T | T[]) => void;
  options: { value: T; label: string }[];
  multi?: boolean;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (v: T) => {
    if (multi) {
      const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
      onChange(next as T[]);
    } else {
      onChange(v);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <button key={o.value} onClick={() => toggle(o.value)}
            className={`h-10 px-4 rounded-full text-sm border transition-colors ${
              active ? "bg-ink text-surface border-ink" : "bg-surface text-ink border-border"
            }`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      {label && <SectionLabel>{label}</SectionLabel>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border leading-relaxed" />
    </div>
  );
}

function TagEditor({ label, tags, onChange, presets }: {
  label: string; tags: string[]; onChange: (t: string[]) => void; presets?: string[];
}) {
  const [input, setInput] = useState("");
  const add = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      {presets && (
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.filter(p => !tags.includes(p)).map((p) => (
            <button key={p} onClick={() => add(p)}
              className="h-8 px-3 rounded-full text-xs border border-border-subtle text-ink-muted bg-surface-subtle">
              + {p}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink text-surface text-xs">
            {t}
            <button onClick={() => remove(t)} className="opacity-60 hover:opacity-100 leading-none">×</button>
          </span>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(input))}
        placeholder="Add custom… (press Enter)"
        className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-2.5 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-1 focus:ring-border" />
    </div>
  );
}

// Ranked repair style selector — tap chips in desired priority order
const REPAIR_OPTIONS: { value: RepairStyle; label: string }[] = [
  { value: "time", label: "Time" },
  { value: "consistency", label: "Consistency" },
  { value: "acts", label: "Acts" },
  { value: "words", label: "Words" },
  { value: "gifts", label: "Gifts" },
];

function RepairRanker({ ranking, onChange }: {
  ranking: string[]; onChange: (r: string[]) => void;
}) {
  const toggle = (style: string) => {
    if (ranking.includes(style)) {
      onChange(ranking.filter((s) => s !== style));
    } else {
      onChange([...ranking, style]);
    }
  };
  return (
    <div>
      <p className="text-xs text-ink-subtle mb-3">Tap in priority order. First = highest weight.</p>
      <div className="flex flex-wrap gap-2">
        {REPAIR_OPTIONS.map((o) => {
          const rank = ranking.indexOf(o.value);
          const selected = rank !== -1;
          return (
            <button key={o.value} onClick={() => toggle(o.value)}
              className={`h-10 px-4 rounded-full text-sm border transition-colors flex items-center gap-2 ${
                selected ? "bg-ink text-surface border-ink" : "bg-surface text-ink border-border"
              }`}>
              {selected && (
                <span className="w-4 h-4 rounded-full bg-surface text-ink text-[10px] font-bold flex items-center justify-center leading-none">
                  {rank + 1}
                </span>
              )}
              {o.label}
            </button>
          );
        })}
      </div>
      {ranking.length > 0 && (
        <p className="text-xs text-ink-subtle mt-2">
          Priority: {ranking.map((s, i) => `${i + 1}. ${s}`).join("  ·  ")}
        </p>
      )}
    </div>
  );
}

function Section({ title, children, collapsible = false }: {
  title: string; children: React.ReactNode; collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div>
      <button onClick={() => collapsible && setOpen(!open)}
        className={`flex items-center justify-between w-full mb-3 ${collapsible ? "cursor-pointer" : "cursor-default"}`}>
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium">{title}</p>
        {collapsible && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className={`text-ink-subtle transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TRIGGER_PRESETS = [
  "Sudden communication change",
  "Feeling pressured",
  "Emotional intensity",
  "Mixed signals",
  "Unresolved conflict",
  "Performative repair",
];
const STRESS_PRESETS = [
  "Goes quiet",
  "Overthinks internally",
  "Delays responses",
  "Becomes inconsistent",
  "Pushes away",
];
const TRUST_BUILDER_PRESETS = [
  "Consistent follow-through",
  "Calm tone",
  "Space without disappearing",
  "Small thoughtful actions",
  "Low-pressure invitations",
  "Showing up repeatedly",
];
const TRUST_BREAKER_PRESETS = [
  "Over-texting after distance",
  "Dramatic apologies",
  "Pressuring for clarity",
  "Inconsistency",
  "Compensatory gifts",
  "Heavy relationship talks",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<PartnerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (patch: Partial<PartnerProfile>) =>
    setProfile((p) => ({ ...p, ...patch }));

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile: p }: { profile: PartnerProfile | null }) => {
        if (p) setProfile(p);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Partner Profile</p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Behavioral Profile</h1>
        <p className="text-sm text-ink-muted mt-1">Powers the Analyze engine. More data = sharper recommendations.</p>
      </div>

      {/* ── 1. Core Profile ── */}
      <div className="space-y-4">
        <Section title="Core Profile">
          <Card>
            <SectionLabel>Name</SectionLabel>
            <input type="text" value={profile.name ?? ""} onChange={(e) => set({ name: e.target.value })}
              placeholder="Partner's name"
              className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-1 focus:ring-border" />
          </Card>

          <Card>
            <SectionLabel>Attachment Style</SectionLabel>
            <Chips<string>
              value={profile.attachment_style ?? null}
              onChange={(v) => set({ attachment_style: v as string })}
              options={[
                { value: "Secure", label: "Secure" },
                { value: "Anxious Preoccupied", label: "Anxious" },
                { value: "Dismissive Avoidant", label: "Dismissive" },
                { value: "Fearful Avoidant", label: "Fearful Avoidant" },
                { value: "Unknown", label: "Unknown" },
              ]}
            />
          </Card>

          <Card>
            <SectionLabel>MBTI (optional)</SectionLabel>
            <input type="text" value={profile.mbti ?? ""} onChange={(e) => set({ mbti: e.target.value || null })}
              placeholder="e.g. INFJ, ENFP, unknown"
              className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-1 focus:ring-border" />
            <p className="text-xs text-ink-subtle mt-2">Used lightly as a communication style hint.</p>
          </Card>

          <Card>
            <TextArea label="Core Tension" value={profile.core_tension ?? ""}
              onChange={(v) => set({ core_tension: v })}
              placeholder="What's the underlying push-pull? What does she want vs. fear?"
              rows={3} />
          </Card>

          <Card>
            <SectionLabel>Push-Pull Tendency</SectionLabel>
            <Chips<string>
              value={profile.push_pull_tendency ?? null}
              onChange={(v) => set({ push_pull_tendency: v as string })}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
          </Card>

          <Card>
            <TextArea label="Trust Curve" value={profile.trust_curve ?? ""}
              onChange={(v) => set({ trust_curve: v })}
              placeholder="How does trust build, break, and rebuild over time?"
              rows={2} />
          </Card>
        </Section>
      </div>

      {/* ── 2. Repair + Connection ── */}
      <div className="space-y-4">
        <Section title="Repair + Connection">
          <Card>
            <SectionLabel>Repair Priority Ranking</SectionLabel>
            <RepairRanker
              ranking={profile.repair_style_ranking ?? []}
              onChange={(r) => set({ repair_style_ranking: r, repair_style: (r[0] as RepairStyle) ?? "time" })}
            />
          </Card>

          <Card className="space-y-4">
            <div>
              <SectionLabel>Communication Sensitivity — External</SectionLabel>
              <Chips<CommSensitivity>
                value={(profile.comm_sensitivity as CommSensitivity) ?? null}
                onChange={(v) => set({ comm_sensitivity: v as CommSensitivity })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </div>
            <div>
              <SectionLabel>Communication Sensitivity — Internal</SectionLabel>
              <Chips<CommSensitivity>
                value={(profile.comm_sensitivity_internal as CommSensitivity) ?? null}
                onChange={(v) => set({ comm_sensitivity_internal: v as CommSensitivity })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
              <p className="text-xs text-ink-subtle mt-2">Internal = how much she feels it. External = how much she expresses it.</p>
            </div>
            <textarea value={profile.comm_sensitivity_note ?? ""}
              onChange={(e) => set({ comm_sensitivity_note: e.target.value || null })}
              placeholder="Additional note…" rows={2}
              className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border" />
          </Card>

          <Card className="space-y-4">
            <div>
              <SectionLabel>Gift Sensitivity</SectionLabel>
              <Chips<GiftSensitivity>
                value={(profile.gift_sensitivity as GiftSensitivity) ?? null}
                onChange={(v) => set({ gift_sensitivity: v as GiftSensitivity })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
              <p className="text-xs text-ink-subtle mt-2">Low = gifts risk feeling performative.</p>
            </div>
            <textarea value={profile.gift_sensitivity_note ?? ""}
              onChange={(e) => set({ gift_sensitivity_note: e.target.value || null })}
              placeholder="Note on gifts…" rows={2}
              className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border" />
          </Card>

          <Card className="space-y-4">
            <div>
              <SectionLabel>Best Connection Format — Primary</SectionLabel>
              <Chips<ConnectionFormat>
                value={(profile.best_connection_format as ConnectionFormat) ?? null}
                onChange={(v) => set({ best_connection_format: v as ConnectionFormat })}
                options={[
                  { value: "low-key-hang", label: "Low-key Hang" },
                  { value: "shared-activity", label: "Shared Activity" },
                  { value: "dinner", label: "Dinner" },
                  { value: "walk", label: "Walk" },
                  { value: "call", label: "Call" },
                ]}
              />
            </div>
            <div>
              <SectionLabel>Secondary</SectionLabel>
              <Chips<ConnectionFormat>
                value={(profile.best_connection_secondary as ConnectionFormat) ?? null}
                onChange={(v) => set({ best_connection_secondary: v as ConnectionFormat })}
                options={[
                  { value: "low-key-hang", label: "Low-key Hang" },
                  { value: "shared-activity", label: "Shared Activity" },
                  { value: "dinner", label: "Dinner" },
                  { value: "walk", label: "Walk" },
                  { value: "call", label: "Call" },
                ]}
              />
            </div>
            <textarea value={profile.best_connection_note ?? ""}
              onChange={(e) => set({ best_connection_note: e.target.value || null })}
              placeholder="Note on connection…" rows={2}
              className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border" />
          </Card>
        </Section>
      </div>

      {/* ── 3. Behavioral Engine ── */}
      <div className="space-y-4">
        <Section title="Behavioral Engine" collapsible>
          <Card>
            <TagEditor label="Trigger Profile" tags={profile.trigger_profile ?? []}
              onChange={(t) => set({ trigger_profile: t })} presets={TRIGGER_PRESETS} />
          </Card>
          <Card>
            <TagEditor label="Default Stress Response" tags={profile.stress_response ?? []}
              onChange={(t) => set({ stress_response: t })} presets={STRESS_PRESETS} />
          </Card>
          <Card>
            <TextArea label="Re-engagement Pattern" value={profile.reengagement_pattern ?? ""}
              onChange={(v) => set({ reengagement_pattern: v })}
              placeholder="How does she typically return after distance? What works?" rows={3} />
          </Card>
          <Card>
            <TagEditor label="Trust Builders" tags={profile.trust_builders ?? []}
              onChange={(t) => set({ trust_builders: t })} presets={TRUST_BUILDER_PRESETS} />
          </Card>
          <Card>
            <TagEditor label="Trust Breakers" tags={profile.trust_breakers ?? []}
              onChange={(t) => set({ trust_breakers: t })} presets={TRUST_BREAKER_PRESETS} />
          </Card>
        </Section>
      </div>

      {/* ── 4. Analyze Guidance ── */}
      <div className="bg-surface-subtle rounded-2xl border border-border-subtle px-5 py-4 space-y-3">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium">How Analyze Uses This</p>
        <ul className="space-y-2">
          {[
            "Repair priority ranking weights which actions and messages to recommend first",
            "Triggers and stress response inform what to avoid and when to give space",
            "Attachment style shapes the tone and intensity of every recommendation",
            "Trust builders / breakers directly influence the \"What not to do\" output",
            "Connection format drives action recommendations (hang vs. dinner vs. call)",
            "Past conversations are referenced to detect patterns over time",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-xs text-ink-muted">
              <span className="text-ink-subtle mt-0.5 shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Notes */}
      <Card>
        <TextArea label="Additional Notes" value={profile.notes ?? ""}
          onChange={(v) => set({ notes: v })}
          placeholder="Anything else worth knowing…" rows={3} />
      </Card>

      <div className="relative">
        <button onClick={handleSave} disabled={saving}
          className="w-full h-14 bg-ink text-surface rounded-2xl text-base font-medium transition-all">
          {saving ? "Saving…" : "Save Profile"}
        </button>
        {saved && (
          <div className="absolute inset-0 flex items-center justify-center bg-solid rounded-2xl pointer-events-none">
            <p className="text-surface text-base font-medium">Saved ✓</p>
          </div>
        )}
      </div>

      <DataControls />
    </div>
  );
}

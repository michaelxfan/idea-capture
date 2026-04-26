"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AiInsights,
  RelationshipStrength,
  ReverseValue,
  Stakeholder,
  StakeholderGoals,
  GoalStatus,
  OfferPriority,
  Milestone,
  StakeholderDependencies,
  GapAnalysis,
  GapStep,
} from "@/lib/types";
import { RelationshipChip, ScoreDots, OfficeBadge, StatusChip } from "@/components/Chips";
import { priorityScore } from "@/lib/score";
import { WEEKDAYS, labelDay } from "@/lib/days";

type Tab = "profile" | "need" | "helps" | "reverse" | "coaching" | "inperson" | "deps" | "gap";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "need", label: "What I Need" },
  { key: "helps", label: "They Can Help" },
  { key: "reverse", label: "Reverse Value" },
  { key: "coaching", label: "Coaching" },
  { key: "inperson", label: "In-Person" },
  { key: "deps", label: "Dependencies" },
  { key: "gap", label: "Path to Aligned" },
];

const OFFER_PRIORITY_LABEL: Record<OfferPriority, string> = {
  high: "High priority to them",
  medium: "Medium priority to them",
  low: "Low priority to them",
};

const OFFER_PRIORITY_CLASS: Record<OfferPriority, string> = {
  high: "chip-danger",
  medium: "chip-warn",
  low: "chip",
};

export default function StakeholderDetail({
  stakeholder,
  initialGoals,
  initialReverse,
  initialInsights,
  initialDependencies,
  initialGapAnalysis,
}: {
  stakeholder: Stakeholder;
  initialGoals: StakeholderGoals | null;
  initialReverse: ReverseValue | null;
  initialInsights: AiInsights | null;
  initialDependencies: StakeholderDependencies | null;
  initialGapAnalysis: GapAnalysis | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [s, setS] = useState(stakeholder);
  const [goals, setGoals] = useState<StakeholderGoals>(
    initialGoals ?? {
      stakeholderId: stakeholder.id,
      priorityLevel: 3,
      status: "open",
      milestones: [],
    }
  );
  const [reverse, setReverse] = useState<ReverseValue>(
    initialReverse ?? { stakeholderId: stakeholder.id, offerPriority: "medium" }
  );
  const [insights, setInsights] = useState<AiInsights | null>(initialInsights);
  const [coaching, setCoaching] = useState<CoachingOut | null>(null);
  const [aiLoading, setAiLoading] = useState<null | "insights" | "coaching" | "reverse" | "gap">(null);
  const [aiReverse, setAiReverse] = useState<AiReverse | null>(null);
  const [deps, setDeps] = useState<StakeholderDependencies>(
    initialDependencies ?? { stakeholderId: stakeholder.id, blocks: [], blockedBy: [] }
  );
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(initialGapAnalysis);
  const [saving, startSaving] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  async function saveStakeholder(patch: Partial<Stakeholder>) {
    const next = { ...s, ...patch };
    setS(next);
    startSaving(async () => {
      await fetch(`/api/stakeholders/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      router.refresh();
    });
  }

  async function saveGoals() {
    startSaving(async () => {
      const res = await fetch(`/api/stakeholders/${s.id}/goals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goals),
      });
      const data = await res.json();
      if (data.goals) setGoals(data.goals);
      flash("Goals saved");
      router.refresh();
    });
  }

  async function saveReverse() {
    startSaving(async () => {
      const res = await fetch(`/api/stakeholders/${s.id}/reverse`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reverse),
      });
      const data = await res.json();
      if (data.reverse) setReverse(data.reverse);
      flash("Saved");
      router.refresh();
    });
  }

  async function saveDeps() {
    startSaving(async () => {
      const res = await fetch(`/api/stakeholders/${s.id}/dependencies`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deps),
      });
      const data = await res.json();
      if (data.dependencies) setDeps(data.dependencies);
      flash("Dependencies saved");
    });
  }

  async function generateInsights() {
    setAiLoading("insights");
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeholderId: s.id }),
      });
      const data = await res.json();
      if (data.insights) setInsights(data.insights);
      flash(data.mock ? "AI stub (no key)" : "Insights refreshed");
    } finally {
      setAiLoading(null);
    }
  }

  async function generateReverse() {
    setAiLoading("reverse");
    try {
      const res = await fetch("/api/ai/reverse-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeholderId: s.id }),
      });
      const data = await res.json();
      if (data.data) setAiReverse(data.data);
      flash(data.mock ? "AI stub (no key)" : "Reverse value refreshed");
    } finally {
      setAiLoading(null);
    }
  }

  async function generateCoaching() {
    setAiLoading("coaching");
    try {
      const res = await fetch("/api/ai/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeholderId: s.id }),
      });
      const data = await res.json();
      if (data.coaching) setCoaching(data.coaching);
      flash(data.mock ? "AI stub (no key)" : "Coaching updated");
    } finally {
      setAiLoading(null);
    }
  }

  async function generateGapAnalysis() {
    setAiLoading("gap");
    try {
      const res = await fetch("/api/ai/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeholderId: s.id }),
      });
      const data = await res.json();
      if (data.gapAnalysis) setGapAnalysis(data.gapAnalysis);
      flash(data.mock ? "AI stub (no key)" : "Path generated");
    } finally {
      setAiLoading(null);
    }
  }

  async function toggleGapStep(index: number) {
    if (!gapAnalysis) return;
    const steps: GapStep[] = gapAnalysis.steps.map((st, i) =>
      i === index ? { ...st, done: !st.done } : st
    );
    setGapAnalysis({ ...gapAnalysis, steps });
    await fetch(`/api/stakeholders/${s.id}/gap-steps`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
  }

  const score = priorityScore(s, goals);

  async function deleteStakeholder() {
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    await fetch(`/api/stakeholders/${s.id}`, { method: "DELETE" });
    router.push("/stakeholders");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{s.name}</h1>
            <div className="text-[var(--text-secondary)]">{s.title || "—"}{s.team ? ` · ${s.team}` : ""}</div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <ScoreDots score={s.influenceScore} />
              <RelationshipChip r={s.relationshipStrength} />
              <OfficeBadge on={s.isInOffice} />
              <StatusChip status={goals.status} />
              <span className="chip">Priority · {score}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className="btn"
              onClick={() => saveStakeholder({ isInOffice: !s.isInOffice })}
              disabled={saving}
            >
              {s.isInOffice ? "Mark remote" : "Mark in office"}
            </button>
            <button className="btn btn-primary" onClick={generateInsights} disabled={aiLoading === "insights"}>
              {aiLoading === "insights" ? "Generating…" : "Refresh AI insights"}
            </button>
            <button
              className="btn text-[var(--danger)] hover:bg-red-50 border-[var(--border)]"
              onClick={deleteStakeholder}
              title="Delete this stakeholder"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--border-light)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`nav-link ${tab === t.key ? "nav-link-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {toast ? <div className="chip chip-ok">{toast}</div> : null}

      {tab === "profile" && (
        <ProfileTab s={s} onSave={saveStakeholder} saving={saving} />
      )}
      {tab === "need" && (
        <NeedTab goals={goals} setGoals={setGoals} onSave={saveGoals} saving={saving} />
      )}
      {tab === "helps" && (
        <HelpsTab insights={insights} aiLoading={aiLoading === "insights"} onRegenerate={generateInsights} />
      )}
      {tab === "reverse" && (
        <ReverseTab
          reverse={reverse}
          setReverse={setReverse}
          onSave={saveReverse}
          saving={saving}
          aiReverse={aiReverse}
          onGenerate={generateReverse}
          aiLoading={aiLoading === "reverse"}
        />
      )}
      {tab === "coaching" && (
        <CoachingTab insights={insights} coaching={coaching} onGenerate={generateCoaching} aiLoading={aiLoading === "coaching"} />
      )}
      {tab === "inperson" && (
        <InPersonTab s={s} insights={insights} onToggle={(v) => saveStakeholder({ isInOffice: v })} />
      )}
      {tab === "deps" && (
        <DepsTab deps={deps} setDeps={setDeps} onSave={saveDeps} saving={saving} stakeholderId={s.id} />
      )}
      {tab === "gap" && (
        <GapTab
          gapAnalysis={gapAnalysis}
          stakeholder={s}
          aiLoading={aiLoading === "gap"}
          onGenerate={generateGapAnalysis}
          onToggleStep={toggleGapStep}
        />
      )}
    </div>
  );
}

/* ===== Profile tab ===== */
function ProfileTab({ s, onSave, saving }: { s: Stakeholder; onSave: (p: Partial<Stakeholder>) => void; saving: boolean }) {
  const [local, setLocal] = useState(s);
  function change<K extends keyof Stakeholder>(k: K, v: Stakeholder[K]) {
    setLocal({ ...local, [k]: v });
  }
  return (
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name">
          <input className="input" value={local.name} onChange={(e) => change("name", e.target.value)} />
        </Field>
        <Field label="Title">
          <input className="input" value={local.title} onChange={(e) => change("title", e.target.value)} />
        </Field>
        <Field label="Team">
          <input className="input" value={local.team} onChange={(e) => change("team", e.target.value)} />
        </Field>
        <Field label="Manager">
          <input className="input" value={local.managerName ?? ""} onChange={(e) => change("managerName", e.target.value)} />
        </Field>
        <Field label="Influence score (1–5)">
          <input type="number" min={1} max={5} className="input" value={local.influenceScore}
            onChange={(e) => change("influenceScore", Math.max(1, Math.min(5, Number(e.target.value))))} />
        </Field>
        <Field label="Relationship strength">
          <select className="select" value={local.relationshipStrength}
            onChange={(e) => change("relationshipStrength", e.target.value as RelationshipStrength)}>
            <option value="cold">Cold</option>
            <option value="neutral">Neutral</option>
            <option value="aligned">Aligned</option>
            <option value="sponsor">Sponsor</option>
          </select>
        </Field>
      </div>
      <Field label="Impact areas (comma-separated)">
        <input className="input" value={local.impactAreas.join(", ")}
          onChange={(e) => change("impactAreas", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
      </Field>
      <Field label="Notes">
        <textarea className="textarea" value={local.notes ?? ""} rows={4}
          onChange={(e) => change("notes", e.target.value)} />
      </Field>
      <div>
        <span className="label">Typical office days</span>
        <div className="flex gap-2 flex-wrap mt-1">
          {WEEKDAYS.map((day) => {
            const on = local.officeDays.includes(day);
            return (
              <button key={day} type="button"
                onClick={() => change("officeDays", on ? local.officeDays.filter((d) => d !== day) : [...local.officeDays, day])}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  on ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                     : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-alt)]"
                }`}>
                {labelDay(day)}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Used to auto-set in-office status on the In Office Today page.</p>
      </div>
      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={saving}
          onClick={() => onSave({
            name: local.name, title: local.title, team: local.team,
            managerName: local.managerName, influenceScore: local.influenceScore,
            relationshipStrength: local.relationshipStrength, impactAreas: local.impactAreas,
            notes: local.notes, officeDays: local.officeDays,
          })}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

/* ===== Need tab ===== */
const DEFAULT_MILESTONES: Milestone[] = [
  { label: "Draft memo / data case", done: false },
  { label: "Demo impact in a meeting", done: false },
  { label: "Address objections", done: false },
  { label: "Decision", done: false },
];

function NeedTab({ goals, setGoals, onSave, saving }: {
  goals: StakeholderGoals; setGoals: (g: StakeholderGoals) => void; onSave: () => void; saving: boolean;
}) {
  function set<K extends keyof StakeholderGoals>(k: K, v: StakeholderGoals[K]) {
    setGoals({ ...goals, [k]: v });
  }

  const milestones: Milestone[] = goals.milestones?.length ? goals.milestones : DEFAULT_MILESTONES;

  function toggleMilestone(i: number) {
    const next = milestones.map((m, idx) => idx === i ? { ...m, done: !m.done } : m);
    set("milestones", next);
  }

  function addMilestone() {
    set("milestones", [...milestones, { label: "", done: false }]);
  }

  function setMilestoneLabel(i: number, label: string) {
    const next = milestones.map((m, idx) => idx === i ? { ...m, label } : m);
    set("milestones", next);
  }

  function removeMilestone(i: number) {
    set("milestones", milestones.filter((_, idx) => idx !== i));
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="1 month">
          <textarea className="textarea" rows={3} value={goals.goal1m ?? ""} onChange={(e) => set("goal1m", e.target.value)} />
        </Field>
        <Field label="3 months">
          <textarea className="textarea" rows={3} value={goals.goal3m ?? ""} onChange={(e) => set("goal3m", e.target.value)} />
        </Field>
        <Field label="12 months">
          <textarea className="textarea" rows={3} value={goals.goal12m ?? ""} onChange={(e) => set("goal12m", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Why it matters to me">
          <textarea className="textarea" rows={3} value={goals.whyItMattersToMe ?? ""} onChange={(e) => set("whyItMattersToMe", e.target.value)} />
        </Field>
        <Field label="Why it matters to them">
          <textarea className="textarea" rows={3} value={goals.whyItMattersToThem ?? ""} onChange={(e) => set("whyItMattersToThem", e.target.value)} />
        </Field>
      </div>
      <Field label="Blockers">
        <textarea className="textarea" rows={2} value={goals.blockers ?? ""} onChange={(e) => set("blockers", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Priority (1–5)">
          <input type="number" min={1} max={5} className="input" value={goals.priorityLevel}
            onChange={(e) => set("priorityLevel", Math.max(1, Math.min(5, Number(e.target.value))))} />
        </Field>
        <Field label="Status">
          <select className="select" value={goals.status} onChange={(e) => set("status", e.target.value as GoalStatus)}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="parked">Parked</option>
          </select>
        </Field>
        <Field label="Decision deadline">
          <input type="date" className="input" value={goals.decisionDeadline ?? ""}
            onChange={(e) => set("decisionDeadline", e.target.value || undefined)} />
        </Field>
        <Field label="Risk compounds in (days)">
          <input type="number" min={0} className="input" value={goals.compoundingRiskDays ?? ""}
            onChange={(e) => set("compoundingRiskDays", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
      </div>

      {/* Journey milestones stepper */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label">Journey milestones</span>
          <button type="button" className="btn btn-ghost text-xs" onClick={addMilestone}>+ Add step</button>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start" style={{ minWidth: milestones.length * 110 }}>
            {milestones.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center relative">
                {/* connector line to next step */}
                {i < milestones.length - 1 && (
                  <div className="absolute top-4 left-1/2 right-0 h-0.5 bg-[var(--border)]" style={{ width: "100%" }} />
                )}
                <button
                  type="button"
                  onClick={() => toggleMilestone(i)}
                  className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                    m.done ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "border-[var(--border)] bg-[var(--surface)]"
                  }`}
                >
                  {m.done ? "✓" : i + 1}
                </button>
                <input
                  className="mt-2 text-xs text-center bg-transparent border-none outline-none w-full px-1"
                  value={m.label}
                  placeholder="Step label"
                  onChange={(e) => setMilestoneLabel(i, e.target.value)}
                />
                <button type="button" onClick={() => removeMilestone(i)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--danger)] mt-0.5">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save goals"}
        </button>
      </div>
    </div>
  );
}

/* ===== Helps / AI insights tab ===== */
function HelpsTab({ insights, aiLoading, onRegenerate }: {
  insights: AiInsights | null; aiLoading: boolean; onRegenerate: () => void;
}) {
  if (!insights) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">No AI insights generated yet.</p>
        <button className="btn btn-primary mt-4" onClick={onRegenerate} disabled={aiLoading}>
          {aiLoading ? "Generating…" : "Generate AI insights"}
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-tertiary)]">Generated {new Date(insights.generatedAt).toLocaleString()}</p>
        <button className="btn btn-ghost" onClick={onRegenerate} disabled={aiLoading}>
          {aiLoading ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListCard title="Role synergies with my role" items={insights.roleSynergies} />
        <ListCard title="How they can unblock me" items={insights.influenceRecommendations} />
      </div>
      <NextBestAction action={insights.nextBestAction} />
    </div>
  );
}

/* ===== Reverse value tab ===== */
interface AiReverse {
  howIHelpThem: string[];
  whatICanOffer: string[];
  outcomesTheyCareAbout: string[];
  thisWeek: string[];
  thisMonth: string[];
  thisQuarter: string[];
}

function ReverseTab({ reverse, setReverse, onSave, saving, aiReverse, onGenerate, aiLoading }: {
  reverse: ReverseValue; setReverse: (r: ReverseValue) => void; onSave: () => void; saving: boolean;
  aiReverse: AiReverse | null; onGenerate: () => void; aiLoading: boolean;
}) {
  function set<K extends keyof ReverseValue>(k: K, v: ReverseValue[K]) {
    setReverse({ ...reverse, [k]: v });
  }
  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="label">Priority of your offer to them</span>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as OfferPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("offerPriority", p)}
                className={`chip capitalize transition-colors ${reverse.offerPriority === p ? OFFER_PRIORITY_CLASS[p] : ""}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="How my role helps them">
            <textarea className="textarea" rows={3} value={reverse.howIHelpThem ?? ""} onChange={(e) => set("howIHelpThem", e.target.value)} />
          </Field>
          <Field label="What I can offer">
            <textarea className="textarea" rows={3} value={reverse.whatIOffer ?? ""} onChange={(e) => set("whatIOffer", e.target.value)} />
          </Field>
          <Field label="Trade opportunities">
            <textarea className="textarea" rows={3} value={reverse.tradeOpportunities ?? ""} onChange={(e) => set("tradeOpportunities", e.target.value)} />
          </Field>
          <Field label="Support actions">
            <textarea className="textarea" rows={3} value={reverse.supportActions ?? ""} onChange={(e) => set("supportActions", e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-between items-center">
          <button className="btn" onClick={onGenerate} disabled={aiLoading}>
            {aiLoading ? "Generating…" : "Get AI suggestions"}
          </button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {reverse.offerPriority && (
        <div className={`chip ${OFFER_PRIORITY_CLASS[reverse.offerPriority]} inline-block`}>
          {OFFER_PRIORITY_LABEL[reverse.offerPriority]}
        </div>
      )}

      {aiReverse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListCard title="Outcomes they care about" items={aiReverse.outcomesTheyCareAbout} />
          <ListCard title="What I can offer (AI)" items={aiReverse.whatICanOffer} />
          <ListCard title="This week" items={aiReverse.thisWeek} />
          <ListCard title="This month" items={aiReverse.thisMonth} />
          <ListCard title="This quarter" items={aiReverse.thisQuarter} />
          <ListCard title="How I already help them" items={aiReverse.howIHelpThem} />
        </div>
      ) : null}
    </div>
  );
}

/* ===== Coaching tab ===== */
interface CoachingOut {
  strengths: string[];
  gaps: string[];
  riskiestAssumption: string;
  biggestLeverage: string;
  practiceScript: string;
}

function CoachingTab({ insights, coaching, onGenerate, aiLoading }: {
  insights: AiInsights | null; coaching: CoachingOut | null; onGenerate: () => void; aiLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      {insights ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListCard title="How to frame the ask" items={insights.framingRecommendations} />
          <ListCard title="Likely objections" items={insights.likelyObjections} />
          <ListCard title="Recommended language" items={insights.recommendedLanguage} />
          <ListCard title="Tactics to get buy-in" items={insights.influenceRecommendations} />
        </div>
      ) : null}

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Honest coaching pass</h3>
          <button className="btn btn-primary" onClick={onGenerate} disabled={aiLoading}>
            {aiLoading ? "Thinking…" : coaching ? "Re-evaluate" : "Get feedback on my approach"}
          </button>
        </div>
        {coaching ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ListCard title="Strengths" items={coaching.strengths} />
            <ListCard title="Gaps" items={coaching.gaps} />
            <div className="card-alt p-4">
              <div className="label">Riskiest assumption</div>
              <div className="text-sm">{coaching.riskiestAssumption}</div>
            </div>
            <div className="card-alt p-4">
              <div className="label">Biggest leverage</div>
              <div className="text-sm font-medium">{coaching.biggestLeverage}</div>
            </div>
            <div className="card-alt p-4 md:col-span-2">
              <div className="label">Practice script</div>
              <div className="text-sm italic">{coaching.practiceScript}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ===== In-person tab ===== */
function InPersonTab({ s, insights, onToggle }: {
  s: Stakeholder; insights: AiInsights | null; onToggle: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="font-medium">Is {s.name} in the office today?</div>
          <div className="text-sm text-[var(--text-secondary)]">Toggle on to include them on today's in-person plan.</div>
        </div>
        <button className="btn" onClick={() => onToggle(!s.isInOffice)}>
          {s.isInOffice ? "Yes — mark remote" : "No — mark in office"}
        </button>
      </div>
      {insights?.inPersonTalkingPoints?.length ? (
        <>
          <ListCard title="Talk about today" items={insights.inPersonTalkingPoints} />
          <NextBestAction action={insights.nextBestAction} />
        </>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          Generate AI insights first to see in-person talking points.
        </p>
      )}
    </div>
  );
}

/* ===== Dependencies tab ===== */
function DepsTab({ deps, setDeps, onSave, saving, stakeholderId }: {
  deps: StakeholderDependencies;
  setDeps: (d: StakeholderDependencies) => void;
  onSave: () => void;
  saving: boolean;
  stakeholderId: string;
}) {
  function addBlock() {
    setDeps({ ...deps, blocks: [...deps.blocks, { stakeholderId: "", note: "" }] });
  }
  function addBlockedBy() {
    setDeps({ ...deps, blockedBy: [...deps.blockedBy, { stakeholderId: "", reason: "" }] });
  }
  function updateBlock(i: number, patch: Partial<{ stakeholderId: string; note: string }>) {
    const next = deps.blocks.map((b, idx) => idx === i ? { ...b, ...patch } : b);
    setDeps({ ...deps, blocks: next });
  }
  function updateBlockedBy(i: number, patch: Partial<{ stakeholderId: string; reason: string }>) {
    const next = deps.blockedBy.map((b, idx) => idx === i ? { ...b, ...patch } : b);
    setDeps({ ...deps, blockedBy: next });
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-base font-semibold">This person's decisions affect</h3>
            <button className="btn btn-ghost" onClick={addBlock}>+ Add</button>
          </div>
          {deps.blocks.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No downstream effects recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {deps.blocks.map((b, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className="input" placeholder="Stakeholder ID or name" value={b.stakeholderId}
                      onChange={(e) => updateBlock(i, { stakeholderId: e.target.value })} />
                    <input className="input" placeholder="What is impacted?" value={b.note ?? ""}
                      onChange={(e) => updateBlock(i, { note: e.target.value })} />
                  </div>
                  <button className="text-[var(--text-tertiary)] hover:text-[var(--danger)] mt-2"
                    onClick={() => setDeps({ ...deps, blocks: deps.blocks.filter((_, idx) => idx !== i) })}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-base font-semibold">This person is blocked by</h3>
            <button className="btn btn-ghost" onClick={addBlockedBy}>+ Add</button>
          </div>
          {deps.blockedBy.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No upstream blockers recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {deps.blockedBy.map((b, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className="input" placeholder="Blocker stakeholder ID or name" value={b.stakeholderId}
                      onChange={(e) => updateBlockedBy(i, { stakeholderId: e.target.value })} />
                    <input className="input" placeholder="Reason / what they're waiting on" value={b.reason ?? ""}
                      onChange={(e) => updateBlockedBy(i, { reason: e.target.value })} />
                  </div>
                  <button className="text-[var(--text-tertiary)] hover:text-[var(--danger)] mt-2"
                    onClick={() => setDeps({ ...deps, blockedBy: deps.blockedBy.filter((_, idx) => idx !== i) })}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save dependencies"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Gap Analysis / Path to Aligned tab ===== */
function GapTab({ gapAnalysis, stakeholder, aiLoading, onGenerate, onToggleStep }: {
  gapAnalysis: GapAnalysis | null;
  stakeholder: Stakeholder;
  aiLoading: boolean;
  onGenerate: () => void;
  onToggleStep: (i: number) => void;
}) {
  const done = gapAnalysis?.steps.filter((s) => s.done).length ?? 0;
  const total = gapAnalysis?.steps.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-display text-base font-semibold">Path to Aligned</h3>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              Current: <strong>{stakeholder.relationshipStrength}</strong> → Target: <strong>sponsor</strong>
            </div>
            {total > 0 && (
              <div className="text-xs text-[var(--text-tertiary)] mt-1">{done} / {total} steps complete</div>
            )}
          </div>
          <button className="btn btn-primary" onClick={onGenerate} disabled={aiLoading}>
            {aiLoading ? "Generating…" : gapAnalysis ? "Regenerate path" : "Generate path"}
          </button>
        </div>

        {gapAnalysis ? (
          <div className="mt-5 space-y-2">
            {/* Progress bar */}
            <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand)] transition-all duration-300"
                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              />
            </div>

            <ol className="space-y-2 mt-4">
              {gapAnalysis.steps.map((step, i) => (
                <li key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  step.done ? "border-[var(--brand-soft)] bg-[var(--brand-soft)]" : "border-[var(--border)] bg-[var(--surface)]"
                }`}>
                  <button
                    onClick={() => onToggleStep(i)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 transition-colors mt-0.5 ${
                      step.done ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "border-[var(--border)]"
                    }`}
                  >
                    {step.done ? "✓" : i + 1}
                  </button>
                  <span className={`text-sm ${step.done ? "line-through text-[var(--text-tertiary)]" : ""}`}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Generated {new Date(gapAnalysis.generatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="mt-4 text-sm text-[var(--text-secondary)]">
            Click "Generate path" to get an AI-crafted step-by-step plan to move from{" "}
            <strong>{stakeholder.relationshipStrength}</strong> to sponsor-level alignment.
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== shared bits ===== */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="card p-4">
      <div className="label mb-2">{title}</div>
      <ul className="space-y-1.5 text-sm">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-[var(--text-tertiary)] shrink-0">·</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NextBestAction({ action }: { action: string }) {
  if (!action) return null;
  return (
    <div className="card p-4 border-[var(--accent)]">
      <div className="label">Next best action</div>
      <div className="font-medium">{action}</div>
    </div>
  );
}

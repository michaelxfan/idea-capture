"use client";
import { useState } from "react";
import Link from "next/link";
import type { Stakeholder, StakeholderGoals } from "@/lib/types";

interface Pairing {
  allyName: string;
  allyId: string;
  unlocksAsk: string;
  targetName: string;
  targetId: string;
  rationale: string;
  enlistmentDraft: string;
}

interface Props {
  allies: { s: Stakeholder; g?: StakeholderGoals }[];
  blocked: { s: Stakeholder; g?: StakeholderGoals }[];
}

export default function DashboardClient({ allies, blocked }: Props) {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Pairing | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/alignment-council", { method: "POST" });
      const data = await res.json();
      setPairings(data.pairings ?? []);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      {/* Allies list */}
      <div className="flex flex-wrap gap-2 mb-1">
        {allies.map(({ s }) => (
          <Link key={s.id} href={`/stakeholders/${s.id}`} className={`chip ${s.relationshipStrength === "sponsor" ? "chip-ok" : "chip-brand"}`}>
            {s.name} · {s.relationshipStrength}
          </Link>
        ))}
      </div>

      {pairings.length === 0 ? (
        <button className="btn btn-primary" onClick={generate} disabled={loading || blocked.length === 0}>
          {loading ? "Analyzing…" : blocked.length === 0 ? "No blocked asks" : "Generate ally pairings"}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">{pairings.length} pairing{pairings.length !== 1 ? "s" : ""} found</span>
            <button className="btn btn-ghost" onClick={generate} disabled={loading}>
              {loading ? "Analyzing…" : "Refresh"}
            </button>
          </div>
          {pairings.map((p, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm">
                    <Link href={`/stakeholders/${p.allyId}`} className="font-semibold hover:underline">{p.allyName}</Link>
                    <span className="text-[var(--text-tertiary)]"> could help unlock: </span>
                    <Link href={`/stakeholders/${p.targetId}`} className="font-medium hover:underline">{p.targetName}</Link>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 italic">{p.unlocksAsk}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">{p.rationale}</div>
                </div>
                <button
                  className="btn btn-primary shrink-0"
                  onClick={() => { setModal(p); setCopied(false); }}
                >
                  Draft message →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="card p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Enlistment draft</h3>
              <button onClick={() => setModal(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">✕</button>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              To: <strong>{modal.allyName}</strong> · re: <strong>{modal.targetName}</strong>
            </div>
            <div className="card-alt p-4 text-sm italic">{modal.enlistmentDraft}</div>
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => copy(modal.enlistmentDraft)}>
                {copied ? "Copied!" : "Copy"}
              </button>
              <button className="btn btn-primary" onClick={() => setModal(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

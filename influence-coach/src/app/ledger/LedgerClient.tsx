"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LedgerEntry, Stakeholder } from "@/lib/types";

interface Props {
  entries: LedgerEntry[];
  stakeholders: Stakeholder[];
}

function balance(entries: LedgerEntry[], stakeholderId: string) {
  const given = entries.filter((e) => e.stakeholderId === stakeholderId && e.direction === "given").length;
  const received = entries.filter((e) => e.stakeholderId === stakeholderId && e.direction === "received").length;
  return { given, received, diff: given - received };
}

export default function LedgerClient({ entries: initial, stakeholders }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [form, setForm] = useState({
    stakeholderId: stakeholders[0]?.id ?? "",
    direction: "given" as "given" | "received",
    description: "",
    occurredOn: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  async function add() {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.entry) setEntries((prev) => [data.entry, ...prev]);
      setForm((f) => ({ ...f, description: "" }));
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch("/api/ledger", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const filtered = filter === "all" ? entries : entries.filter((e) => e.stakeholderId === filter);

  return (
    <div className="space-y-6">
      {/* Balance summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stakeholders.map((s) => {
          const b = balance(entries, s.id);
          const skewed = Math.abs(b.diff) >= 2;
          return (
            <div key={s.id} className={`card p-4 ${skewed ? "border-amber-400" : ""}`}>
              <Link href={`/stakeholders/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
              <div className="text-xs text-[var(--text-tertiary)] mb-2">{s.title}</div>
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600">↑ {b.given} given</span>
                <span className="text-blue-600">↓ {b.received} received</span>
              </div>
              {skewed && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                  {b.diff > 0
                    ? `You've given more — consider asking for a return.`
                    : `They've given more — suggest offering something back.`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add entry form */}
      <div className="card p-5 space-y-3">
        <h3 className="font-display text-base font-semibold">Log an entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Stakeholder</label>
            <select className="select" value={form.stakeholderId} onChange={(e) => setForm((f) => ({ ...f, stakeholderId: e.target.value }))}>
              {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Direction</label>
            <select className="select" value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as "given" | "received" }))}>
              <option value="given">Favor given (I helped them)</option>
              <option value="received">Favor received (they helped me)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="e.g. Shared Q2 performance deck ahead of board prep"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && void add()}
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.occurredOn} onChange={(e) => setForm((f) => ({ ...f, occurredOn: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={add} disabled={saving || !form.description.trim()}>
            {saving ? "Saving…" : "Log entry"}
          </button>
        </div>
      </div>

      {/* Filter + list */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button className={`chip ${filter === "all" ? "chip-brand" : ""}`} onClick={() => setFilter("all")}>All</button>
          {stakeholders.map((s) => (
            <button key={s.id} className={`chip ${filter === s.id ? "chip-brand" : ""}`} onClick={() => setFilter(s.id)}>
              {s.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-6 text-center text-sm text-[var(--text-secondary)]">
            No entries yet. Log your first favor above.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((e) => {
              const s = stakeholders.find((x) => x.id === e.stakeholderId);
              return (
                <li key={e.id} className="card p-3 flex items-start justify-between gap-3">
                  <div className="flex gap-3 items-start">
                    <span className={`chip shrink-0 ${e.direction === "given" ? "chip-ok" : "chip-brand"}`}>
                      {e.direction === "given" ? "↑ Given" : "↓ Received"}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{e.description}</div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {s?.name} · {e.occurredOn}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(e.id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--danger)] text-xs shrink-0"
                    title="Remove"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

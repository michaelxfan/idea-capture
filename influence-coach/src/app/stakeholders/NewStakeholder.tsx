"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStakeholder() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", team: "" });

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.stakeholder?.id) {
        router.push(`/stakeholders/${data.stakeholder.id}`);
      } else {
        setSaving(false);
      }
    } catch {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Add stakeholder
      </button>
    );
  }
  return (
    <div className="card p-3 flex items-end gap-2">
      <div className="flex-1">
        <label className="label">Name</label>
        <input
          autoFocus
          className="input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="flex-1">
        <label className="label">Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>
      <div className="w-40">
        <label className="label">Team</label>
        <input
          className="input"
          value={form.team}
          onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
        />
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim()}>
        {saving ? "Saving…" : "Save"}
      </button>
      <button className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>
        Cancel
      </button>
    </div>
  );
}

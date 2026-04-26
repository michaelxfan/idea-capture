"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedOrgPerson } from "@/lib/types";

export default function UploadFlow() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [people, setPeople] = useState<ExtractedOrgPerson[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mock, setMock] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPeople([]);
    setMsg(null);
  }

  async function parse() {
    if (!file) return;
    setParsing(true);
    setMsg(null);
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await fetch("/api/org-chart/parse", { method: "POST", body: form });
      const data = await res.json();
      setPeople(data.people ?? []);
      setUploadId(data.uploadId ?? null);
      setMock(Boolean(data.mock));
      if (data.mock) setMsg(data.message ?? "Using manual mode — add people below.");
      else setMsg(`Extracted ${data.people?.length ?? 0} people. Review and edit below, then save.`);
    } catch {
      setMsg("Parse failed — add people manually below.");
    } finally {
      setParsing(false);
    }
  }

  function updatePerson(idx: number, patch: Partial<ExtractedOrgPerson>) {
    setPeople((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function removePerson(idx: number) {
    setPeople((prev) => prev.filter((_, i) => i !== idx));
  }
  function addPerson() {
    setPeople((prev) => [...prev, { name: "", title: "", team: "", managerName: "" }]);
  }

  async function commit() {
    const valid = people.filter((p) => p.name.trim());
    if (valid.length === 0) {
      setMsg("Add at least one person.");
      return;
    }
    setCommitting(true);
    try {
      const res = await fetch("/api/org-chart/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people: valid, uploadId }),
      });
      const data = await res.json();
      setMsg(`Saved ${data.created?.length ?? 0} stakeholders.`);
      setTimeout(() => router.push("/stakeholders"), 700);
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-3">
        <label className="label">Org chart image</label>
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="block text-sm file:btn file:mr-3 file:cursor-pointer"
        />
        {preview ? (
          <div className="mt-3 border border-[var(--border-light)] rounded-md overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="org chart preview" className="w-full max-h-[380px] object-contain bg-[var(--surface-alt)]" />
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            Screenshots work best. PNG, JPG, or WebP up to a few MB.
          </p>
          <button className="btn btn-primary" onClick={parse} disabled={!file || parsing}>
            {parsing ? "Extracting…" : "Extract with AI"}
          </button>
        </div>
      </div>

      {msg ? <div className={`chip ${mock ? "chip-warn" : "chip-ok"}`}>{msg}</div> : null}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold">People to add</h3>
          <button className="btn" onClick={addPerson}>+ Add manually</button>
        </div>
        {people.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Upload and extract an image, or add people manually.
          </p>
        ) : (
          <div className="space-y-2">
            {people.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <label className="label">Name</label>
                  <input className="input" value={p.name} onChange={(e) => updatePerson(i, { name: e.target.value })} />
                </div>
                <div className="col-span-4">
                  <label className="label">Title</label>
                  <input className="input" value={p.title ?? ""} onChange={(e) => updatePerson(i, { title: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">Team</label>
                  <input className="input" value={p.team ?? ""} onChange={(e) => updatePerson(i, { team: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">Manager</label>
                  <input className="input" value={p.managerName ?? ""} onChange={(e) => updatePerson(i, { managerName: e.target.value })} />
                </div>
                <div className="col-span-1 text-right">
                  <button className="btn btn-ghost" onClick={() => removePerson(i)} title="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {people.length > 0 ? (
          <div className="flex justify-end mt-4">
            <button className="btn btn-primary" onClick={commit} disabled={committing}>
              {committing ? "Saving…" : `Save ${people.filter((p) => p.name.trim()).length} stakeholder(s)`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

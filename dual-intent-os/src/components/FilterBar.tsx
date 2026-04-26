"use client";

import type { Domain, CurrentMode, BClassification } from "@/types";

const DOMAINS: Domain[] = ["work", "health", "social", "admin", "creative", "personal"];
const MODES: CurrentMode[] = ["A", "B", "mixed", "unclear"];
const B_CLASS: BClassification[] = [
  "strategic",
  "protective",
  "healthy",
  "avoidant",
  "mixed",
  "unclear",
];

export type Filters = {
  q: string;
  domain: Domain | null;
  mode: CurrentMode | null;
  bClass: BClassification | null;
};

export default function FilterBar({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (v: Filters) => void;
}) {
  return (
    <div className="card p-4 space-y-3">
      <input
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        placeholder="Search situations…"
        className="input"
      />
      <Row
        label="Domain"
        options={DOMAINS}
        value={value.domain}
        onChange={(v) => onChange({ ...value, domain: v })}
      />
      <Row
        label="Mode"
        options={MODES}
        value={value.mode}
        onChange={(v) => onChange({ ...value, mode: v })}
      />
      <Row
        label="B class"
        options={B_CLASS}
        value={value.bClass}
        onChange={(v) => onChange({ ...value, bClass: v })}
      />
    </div>
  );
}

function Row<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(value === o ? null : o)}
            className={value === o ? "chip-active" : "chip hover:border-ink-400"}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

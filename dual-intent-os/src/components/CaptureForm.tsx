"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InterpretationCard from "./InterpretationCard";
import { store } from "@/lib/store";
import type { Interpretation } from "@/lib/ai/schema";
import type { Domain, EnergyLevel, EmotionalTone, Stakes } from "@/types";

const DOMAINS: Domain[] = ["work", "health", "social", "admin", "creative", "personal"];
const ENERGY: EnergyLevel[] = ["low", "medium", "high"];
const TONES: EmotionalTone[] = ["calm", "resistant", "anxious", "tired", "excited", "unclear"];
const STAKES: Stakes[] = ["low", "medium", "high"];

export default function CaptureForm() {
  const router = useRouter();
  const [situation, setSituation] = useState("");
  const [domain, setDomain] = useState<Domain | null>(null);
  const [timeAvail, setTimeAvail] = useState<string>("");
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [tone, setTone] = useState<EmotionalTone | null>(null);
  const [stakes, setStakes] = useState<Stakes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Interpretation | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation_text: situation,
          domain,
          time_available_minutes: timeAvail ? parseInt(timeAvail, 10) : null,
          energy_level: energy,
          emotional_tone: tone,
          stakes,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Interpretation failed");
      }
      const data = (await res.json()) as { interpretation: Interpretation };
      store.create({
        situation_text: situation,
        domain,
        time_available_minutes: timeAvail ? parseInt(timeAvail, 10) : null,
        energy_level: energy,
        emotional_tone: tone,
        stakes,
        interpretation: data.interpretation,
      });
      setResult(data.interpretation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setSituation("");
    setDomain(null);
    setTimeAvail("");
    setEnergy(null);
    setTone(null);
    setStakes(null);
  }

  if (result) {
    return (
      <div className="space-y-6">
        <InterpretationCard interp={result} />
        <div className="flex gap-3">
          <button onClick={reset} className="btn-primary">+ New capture</button>
          <button onClick={() => router.push("/dashboard")} className="btn-secondary">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="label">Situation</label>
        <textarea
          autoFocus
          required
          minLength={4}
          rows={5}
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="What's in front of you right now? One or two sentences is plenty."
          className="input resize-none font-serif text-lg leading-relaxed"
        />
      </div>

      <ChipGroup label="Domain" options={DOMAINS} value={domain} onChange={setDomain} />
      <ChipGroup label="Energy" options={ENERGY} value={energy} onChange={setEnergy} />
      <ChipGroup label="Emotional tone" options={TONES} value={tone} onChange={setTone} />
      <ChipGroup label="Stakes" options={STAKES} value={stakes} onChange={setStakes} />

      <div>
        <label className="label">Time available (minutes, optional)</label>
        <input
          type="number"
          min={1}
          value={timeAvail}
          onChange={(e) => setTimeAvail(e.target.value)}
          className="input max-w-[160px]"
          placeholder="e.g. 20"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading || situation.length < 4}>
          {loading ? "Interpreting…" : "Interpret"}
        </button>
      </div>
    </form>
  );
}

function ChipGroup<T extends string>({
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
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? null : opt)}
              className={active ? "chip-active" : "chip hover:border-ink-400"}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

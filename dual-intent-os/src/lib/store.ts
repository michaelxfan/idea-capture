"use client";

import type { Capture } from "@/types";
import type { Interpretation } from "@/lib/ai/schema";
import { buildTodaySeed } from "./seedToday";
import { annotateCaptures } from "./analysis";

const KEY = "dual-intent-os:captures:v2";
const LEGACY_KEY = "dual-intent-os:captures:v1";

function read(): Capture[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Capture[];
  } catch {
    return [];
  }
}

function write(rows: Capture[]) {
  if (typeof window === "undefined") return;
  const annotated = annotateCaptures(rows);
  localStorage.setItem(KEY, JSON.stringify(annotated));
  window.dispatchEvent(new Event("dio:store"));
}

export const store = {
  list(): Capture[] {
    const rows = read();
    return annotateCaptures(rows).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  },

  get(id: string): Capture | undefined {
    return read().find((c) => c.id === id);
  },

  create(input: {
    situation_text: string;
    domain: Capture["domain"];
    time_available_minutes: number | null;
    energy_level: Capture["energy_level"];
    emotional_tone: Capture["emotional_tone"];
    stakes: Capture["stakes"];
    interpretation: Interpretation;
  }): Capture {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const row: Capture = {
      id,
      user_id: "local",
      created_at: new Date().toISOString(),
      situation_text: input.situation_text,
      domain: input.domain,
      time_available_minutes: input.time_available_minutes,
      energy_level: input.energy_level,
      emotional_tone: input.emotional_tone,
      stakes: input.stakes,
      ai_status: "ready",
      outcome_status: null,
      reflection_note: null,
      ...input.interpretation,
    };
    write([row, ...read()]);
    return row;
  },

  update(id: string, patch: Partial<Capture>) {
    write(read().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  },

  remove(id: string) {
    write(read().filter((c) => c.id !== id));
  },

  seedDemo() {
    // Legacy v1 cleanup
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {}
    }
    if (read().length > 0) return;
    const seed = buildTodaySeed();
    const rows: Capture[] = seed.map((d, i) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(i),
      user_id: "local",
      ...d,
    }));
    write(rows);
  },

  clear() {
    write([]);
  },

  reseed() {
    this.clear();
    this.seedDemo();
  },
};

export function useStoreSubscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("dio:store", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("dio:store", handler);
    window.removeEventListener("storage", handler);
  };
}

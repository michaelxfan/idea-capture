"use client";

import { useState, useEffect } from "react";
import { buildRecommendation } from "@/lib/drift";
import type { RepairRecommendation, DailyLog } from "@/lib/types";
import Card, { SectionLabel } from "@/components/Card";
import DriftBadge from "@/components/DriftBadge";

type MessageTone = "light" | "direct" | "warm";

const toneDescriptions: Record<MessageTone, string> = {
  light: "Casual, low-pressure. Resumes warmth without commentary.",
  direct: "Accountable, clear. Names the drift without over-explaining.",
  warm: "Emotionally present. Owns it and points toward reconnection.",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium border border-border rounded-lg px-3 py-1.5 hover:border-ink transition-colors"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MessageCard({
  tone,
  message,
  active,
  onSelect,
}: {
  tone: MessageTone;
  message: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-4 transition-all shadow-card ${
        active
          ? "border-ink bg-surface ring-1 ring-ink"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[11px] uppercase tracking-widest font-medium ${
            active ? "text-ink" : "text-ink-subtle"
          }`}
        >
          {tone}
        </span>
        {active && (
          <span className="text-[11px] uppercase tracking-widest font-medium text-ink">
            Selected
          </span>
        )}
      </div>
      <p className="text-sm text-ink leading-relaxed italic">"{message}"</p>
      <p className="text-xs text-ink-subtle mt-2">{toneDescriptions[tone]}</p>
    </button>
  );
}

export default function MessagesPage() {
  const [rec, setRec] = useState<RepairRecommendation | null>(null);
  const [selected, setSelected] = useState<MessageTone>("direct");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/logs?limit=14")
      .then((r) => r.json())
      .then(({ logs }: { logs: DailyLog[] }) => {
        setRec(buildRecommendation(logs));
      });
  }, []);

  const handleCopy = async () => {
    if (!rec) return;
    const msg =
      selected === "light"
        ? rec.say_light
        : selected === "direct"
        ? rec.say_direct
        : rec.say_warm;
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!rec) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  const messages: Record<MessageTone, string> = {
    light: rec.say_light,
    direct: rec.say_direct,
    warm: rec.say_warm,
  };

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">
          Communication
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          Message Generator
        </h1>
      </div>

      {/* Context */}
      <Card className="!py-4">
        <div className="flex items-center gap-3">
          <DriftBadge level={rec.drift_level} size="sm" />
          <p className="text-sm text-ink-muted">{rec.why}</p>
        </div>
      </Card>

      {/* Tone selector */}
      <div>
        <SectionLabel>Choose Your Tone</SectionLabel>
        <div className="space-y-3">
          {(["light", "direct", "warm"] as MessageTone[]).map((tone) => (
            <MessageCard
              key={tone}
              tone={tone}
              message={messages[tone]}
              active={selected === tone}
              onSelect={() => setSelected(tone)}
            />
          ))}
        </div>
      </div>

      {/* Copy CTA */}
      <button
        onClick={handleCopy}
        className="w-full h-14 bg-ink text-surface rounded-2xl text-base font-medium"
      >
        {copied ? "Copied to clipboard ✓" : `Copy ${selected.charAt(0).toUpperCase() + selected.slice(1)} Message`}
      </button>

      {/* Guardrail */}
      {rec.guardrail && (
        <div className="bg-surface-subtle rounded-2xl border border-border-subtle px-5 py-4">
          <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1.5">
            Guardrail
          </p>
          <p className="text-sm text-ink-muted leading-relaxed">{rec.guardrail}</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { AnalysisResult, FollowUpResponse, PartnerProfile, AnalyzeConversation, DriftLevel } from "@/lib/types";
import DriftBadge from "@/components/DriftBadge";
import Card, { SectionLabel } from "@/components/Card";

type MessageTone = "light" | "direct" | "warm";

const actionLabels: Record<string, string> = {
  none: "No action needed", message: "Send a message", "voice-note": "Voice note",
  "coffee-walk": "Plan a coffee or walk", dinner: "Plan dinner",
  gesture: "Small thoughtful gesture", "quality-time-block": "Quality time block",
};

const confidenceColors = { low: "text-light-drift", medium: "text-ink-muted", high: "text-solid" };

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// ── Outcome Logger ────────────────────────────────────────────────────────────
function OutcomeLogger({
  convId, result, onSave,
}: {
  convId: string | null;
  result: AnalysisResult;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [followed, setFollowed] = useState<"yes" | "partially" | "no" | null>(null);
  const [outcome, setOutcome] = useState<"helped" | "neutral" | "made-worse" | "too-early" | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = followed !== null && outcome !== null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await fetch("/api/analyze-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: convId,
          followed,
          outcome,
          notes: notes.trim() || null,
          situation_summary: result.situation_summary,
          recommended_action: result.do,
          recommended_message: result.say_direct,
          what_not_to_do: result.what_not_to_do,
        }),
      });
      onSave();
    } catch {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full h-12 border border-border rounded-2xl text-sm text-ink-muted font-medium hover:bg-surface-subtle transition-colors"
      >
        Log What Happened →
      </button>
    );
  }

  const followedOpts = [
    { v: "yes" as const, label: "Yes" },
    { v: "partially" as const, label: "Partially" },
    { v: "no" as const, label: "No" },
  ];
  const outcomeOpts = [
    { v: "helped" as const, label: "Helped" },
    { v: "neutral" as const, label: "Neutral" },
    { v: "made-worse" as const, label: "Made Worse" },
    { v: "too-early" as const, label: "Too Early" },
  ];

  return (
    <Card className="space-y-4">
      <SectionLabel>Log What Happened</SectionLabel>

      <div>
        <p className="text-xs text-ink-muted mb-2">Did you follow the recommendation?</p>
        <div className="flex gap-2">
          {followedOpts.map((o) => (
            <button key={o.v} onClick={() => setFollowed(o.v)}
              className={`flex-1 h-10 rounded-xl text-sm font-medium border transition-colors ${
                followed === o.v ? "bg-ink text-surface border-ink" : "bg-surface text-ink border-border"
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-muted mb-2">How did it go?</p>
        <div className="grid grid-cols-2 gap-2">
          {outcomeOpts.map((o) => (
            <button key={o.v} onClick={() => setOutcome(o.v)}
              className={`h-10 rounded-xl text-sm font-medium border transition-colors ${
                outcome === o.v ? "bg-ink text-surface border-ink" : "bg-surface text-ink border-border"
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-muted mb-2">Notes (optional)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What actually happened…"
          rows={2}
          className="w-full bg-surface-subtle rounded-xl border border-border-subtle px-4 py-3 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none focus:ring-1 focus:ring-border"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setOpen(false)}
          className="flex-1 h-10 border border-border rounded-xl text-sm text-ink-subtle">
          Cancel
        </button>
        <button onClick={handleSave} disabled={!canSave || saving}
          className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
            canSave ? "bg-ink text-surface" : "bg-surface-subtle text-ink-subtle border border-border"
          }`}>
          {saving ? "Saving…" : "Save Outcome"}
        </button>
      </div>
    </Card>
  );
}

// ── Analysis result card ──────────────────────────────────────────────────────
function AnalysisCard({
  result, convId, onOutcomeSaved,
}: {
  result: AnalysisResult;
  convId: string | null;
  onOutcomeSaved: () => void;
}) {
  const [tone, setTone] = useState<MessageTone>("direct");
  const [copiedTone, setCopiedTone] = useState<MessageTone | null>(null);
  const [outcomeSaved, setOutcomeSaved] = useState(false);

  const messages: Record<MessageTone, string> = {
    light: result.say_light, direct: result.say_direct, warm: result.say_warm,
  };

  const copy = async (t: MessageTone) => {
    await navigator.clipboard.writeText(messages[t]);
    setCopiedTone(t);
    setTimeout(() => setCopiedTone(null), 2000);
  };

  const handleOutcomeSaved = () => {
    setOutcomeSaved(true);
    onOutcomeSaved();
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card className="!p-5">
        <div className="flex items-center justify-between mb-3">
          <DriftBadge level={result.drift_level} size="md" />
          <div className="flex items-center gap-2">
            <span className={`text-[11px] uppercase tracking-widest font-medium ${confidenceColors[result.confidence]}`}>
              {result.confidence} confidence
            </span>
            <span className="text-2xl font-semibold text-ink-muted">{result.drift_score}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Situation Read</p>
            <p className="text-sm text-ink leading-relaxed">{result.situation_summary}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Likely Dynamic</p>
            <p className="text-sm text-ink-muted leading-relaxed italic">{result.emotional_dynamic}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {result.signals.map((s) => (
            <span key={s} className="text-[11px] bg-surface-subtle border border-border-subtle text-ink-muted px-3 py-1 rounded-full">{s}</span>
          ))}
        </div>

        {result.profile_fit && (
          <p className="text-[11px] text-ink-subtle mt-3 pt-3 border-t border-border">
            Profile fit: {result.profile_fit}
          </p>
        )}
      </Card>

      {/* Message Options */}
      <div>
        <SectionLabel>Message Options</SectionLabel>
        <div className="space-y-2">
          {(["light", "direct", "warm"] as MessageTone[]).map((t) => (
            <div key={t} onClick={() => setTone(t)}
              className={`rounded-2xl border p-4 transition-all shadow-card cursor-pointer ${
                tone === t ? "border-ink ring-1 ring-ink bg-surface" : "border-border bg-surface"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className={`text-[11px] uppercase tracking-widest font-medium ${tone === t ? "text-ink" : "text-ink-subtle"}`}>{t}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); copy(t); }}
                  className="text-[11px] text-ink-subtle border border-border rounded-full px-2.5 py-0.5 hover:bg-surface-subtle transition-colors"
                >
                  {copiedTone === t ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-ink leading-relaxed italic">&ldquo;{messages[t]}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <Card>
        <SectionLabel>Recommended Action</SectionLabel>
        <p className="text-sm font-medium text-ink mb-1">{actionLabels[result.action_intensity]}</p>
        <p className="text-sm text-ink-muted leading-relaxed">{result.do}</p>
      </Card>

      {/* What Not To Do */}
      <Card className="!bg-surface-subtle !border-border-subtle">
        <SectionLabel>What Not To Do</SectionLabel>
        <p className="text-sm text-ink-muted leading-relaxed">{result.what_not_to_do}</p>
      </Card>

      {result.guardrail && (
        <Card className="!bg-surface-subtle !border-border-subtle">
          <SectionLabel>Guardrail</SectionLabel>
          <p className="text-sm text-ink-muted leading-relaxed">{result.guardrail}</p>
        </Card>
      )}

      {/* Ethical framing */}
      <p className="text-[11px] text-ink-subtle text-center leading-relaxed px-2">
        Pattern-based suggestions, not certainties. Use them to communicate better, not to avoid direct conversation.
      </p>

      {/* Outcome logging */}
      {outcomeSaved ? (
        <div className="text-center py-2">
          <p className="text-sm text-solid font-medium">Outcome logged ✓</p>
          <p className="text-[11px] text-ink-subtle mt-0.5">This will improve future recommendations.</p>
        </div>
      ) : (
        <OutcomeLogger convId={convId} result={result} onSave={handleOutcomeSaved} />
      )}
    </div>
  );
}

// ── Past sessions list ────────────────────────────────────────────────────────
function PastSessions({ conversations }: { conversations: AnalyzeConversation[] }) {
  if (conversations.length === 0) return null;
  const levelColors: Record<DriftLevel, string> = {
    solid: "text-solid", "light-drift": "text-light-drift",
    noticeable: "text-noticeable", friction: "text-friction",
  };
  return (
    <div>
      <SectionLabel>Past Sessions</SectionLabel>
      <div className="space-y-2">
        {conversations.map((c) => {
          const date = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <Link key={c.id} href={`/analyze/${c.id}`}>
              <div className="bg-surface border border-border rounded-2xl px-4 py-3 shadow-card flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] uppercase tracking-widest font-medium ${c.drift_level ? levelColors[c.drift_level] : "text-ink-subtle"}`}>
                      {c.drift_level ?? "—"}
                    </span>
                    <span className="text-[11px] text-ink-subtle">{date}</span>
                  </div>
                  <p className="text-xs text-ink-muted truncate">{c.summary ?? "No summary"}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-subtle shrink-0 mt-0.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type ConvMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; type: "analysis"; data: AnalysisResult }
  | { role: "assistant"; type: "followup"; data: FollowUpResponse };

export default function AnalyzePage() {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [conversations, setConversations] = useState<AnalyzeConversation[]>([]);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(({ profile: p }) => setProfile(p));
    fetch("/api/conversations").then((r) => r.json()).then(({ conversations: c }) => setConversations(c ?? []));
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    let finalTranscript = "";
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
        else interim = e.results[i][0].transcript;
      }
      setInput(finalTranscript + interim);
    };
    recognitionRef.current = r;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages]);

  const toggleListening = () => {
    const r = recognitionRef.current;
    if (!r) return;
    if (listening) r.stop(); else r.start();
  };

  const buildClaudeHistory = (): { role: "user" | "assistant"; content: string }[] => {
    return convMessages.map((m) => {
      if (m.role === "user") return { role: "user", content: m.text };
      if (m.type === "analysis") return { role: "assistant", content: `Analysis complete. Drift: ${m.data.drift_level} (${m.data.drift_score}). ${m.data.situation_summary} Follow-up: ${m.data.follow_up_question}` };
      return { role: "assistant", content: m.data.perspective + (m.data.follow_up_question ? ` ${m.data.follow_up_question}` : "") };
    });
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setError(null);
    setLoading(true);

    const isNew = convMessages.length === 0;
    const newUserMsg: ConvMessage = { role: "user", text };
    setConvMessages((prev) => [...prev, newUserMsg]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          profile,
          conversation_id: isNew ? undefined : convId,
          messages: isNew ? [] : buildClaudeHistory(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!convId && data.conversation_id) setConvId(data.conversation_id);

      if (isNew) {
        setConvMessages((prev) => [...prev, { role: "assistant", type: "analysis", data: data.result as AnalysisResult }]);
      } else {
        setConvMessages((prev) => [...prev, { role: "assistant", type: "followup", data: data.result as FollowUpResponse }]);
      }
    } catch {
      setError("Analysis failed. Try again.");
      setConvMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setConvMessages([]);
    setConvId(null);
    setInput("");
    setError(null);
    fetch("/api/conversations").then((r) => r.json()).then(({ conversations: c }) => setConversations(c ?? []));
  };

  const isActive = convMessages.length > 0;
  const lastMessage = convMessages[convMessages.length - 1];
  const followUpQuestion = lastMessage?.role === "assistant"
    ? lastMessage.type === "analysis"
      ? lastMessage.data.follow_up_question
      : lastMessage.data.follow_up_question
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Analyze</p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            {isActive ? "In Progress" : "Tell me what&apos;s going on"}
          </h1>
        </div>
        {isActive && (
          <button onClick={reset} className="h-9 px-4 border border-border rounded-full text-sm text-ink-muted">
            New Session
          </button>
        )}
      </div>

      {/* Conversation thread */}
      {convMessages.map((msg, i) => {
        if (msg.role === "user") {
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] bg-ink text-surface rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        }
        if (msg.type === "analysis") {
          return (
            <AnalysisCard
              key={i}
              result={msg.data}
              convId={convId}
              onOutcomeSaved={() => {}}
            />
          );
        }
        return (
          <div key={i} className="space-y-3">
            <Card className="!bg-surface-subtle !border-border-subtle">
              <p className="text-sm text-ink leading-relaxed">{msg.data.perspective}</p>
            </Card>
          </div>
        );
      })}

      {/* Follow-up prompt */}
      {isActive && followUpQuestion && !loading && (
        <div className="bg-surface border border-border rounded-2xl px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1.5">Follow-up</p>
          <p className="text-sm text-ink leading-relaxed">{followUpQuestion}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 px-1">
          <svg className="animate-spin h-4 w-4 text-ink-subtle" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-ink-muted">Analyzing…</p>
        </div>
      )}

      {error && <p className="text-sm text-friction text-center">{error}</p>}

      {/* Input area */}
      <Card className="!p-0 overflow-hidden">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isActive && followUpQuestion
                ? "Share your perspective…"
                : "Speak or type freely — what's been going on?"
            }
            rows={isActive ? 3 : 5}
            className="w-full bg-surface px-5 pt-4 pb-14 text-sm text-ink placeholder-ink-subtle resize-none focus:outline-none leading-relaxed"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface">
            <button onClick={toggleListening}
              className={`flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium border transition-all ${
                listening ? "bg-friction text-surface border-friction" : "bg-surface text-ink-muted border-border"
              }`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={listening ? "white" : "none"}
                stroke={listening ? "white" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" />
              </svg>
              {listening ? "Listening…" : "Dictate"}
            </button>
            <button onClick={handleSubmit} disabled={!input.trim() || loading}
              className={`h-9 px-5 rounded-full text-sm font-medium transition-all ${
                input.trim() && !loading ? "bg-ink text-surface" : "bg-surface-subtle text-ink-subtle border border-border"
              }`}>
              {isActive ? "Reply" : "Analyze"}
            </button>
          </div>
        </div>
      </Card>

      {listening && (
        <div className="flex items-center gap-2 px-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-friction opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-friction" />
          </span>
          <p className="text-xs text-ink-muted">Recording — tap Dictate again to stop</p>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Past sessions */}
      {!isActive && <PastSessions conversations={conversations} />}
    </div>
  );
}

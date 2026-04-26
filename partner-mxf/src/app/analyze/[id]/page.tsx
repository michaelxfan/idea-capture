import { fetchConversation } from "@/lib/db";
import DriftBadge from "@/components/DriftBadge";
import Card, { SectionLabel } from "@/components/Card";
import Link from "next/link";
import type { AnalysisResult, FollowUpResponse } from "@/lib/types";

function parseMessage(content: string): {
  type: "analysis" | "followup" | "unknown";
  data: AnalysisResult | FollowUpResponse | null;
} {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "analysis") return { type: "analysis", data: parsed.data };
    if (parsed.type === "followup") return { type: "followup", data: parsed.data };
  } catch {/* plain text */}
  return { type: "unknown", data: null };
}

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const conversation = await fetchConversation(params.id);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-sm text-ink-muted">Conversation not found.</p>
        <Link href="/analyze">
          <button className="h-10 px-5 bg-ink text-surface rounded-full text-sm">Back</button>
        </Link>
      </div>
    );
  }

  const messages = conversation.messages ?? [];
  const date = new Date(conversation.created_at).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <Link href="/analyze">
            <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Analyze
            </p>
          </Link>
          <h1 className="text-xl font-semibold text-ink tracking-tight">{date}</h1>
        </div>
        {conversation.drift_level && (
          <DriftBadge level={conversation.drift_level} size="sm" />
        )}
      </div>

      {/* Summary */}
      {conversation.summary && (
        <div className="bg-surface-subtle rounded-2xl border border-border-subtle px-5 py-4">
          <SectionLabel>Session Summary</SectionLabel>
          <p className="text-sm text-ink leading-relaxed">{conversation.summary}</p>
          {conversation.drift_score && (
            <p className="text-xs text-ink-subtle mt-2">Drift score: {conversation.drift_score}</p>
          )}
        </div>
      )}

      {/* Message thread */}
      <div className="space-y-4">
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] bg-ink text-surface rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          }

          const parsed = parseMessage(msg.content);

          if (parsed.type === "analysis") {
            const r = parsed.data as AnalysisResult;
            return (
              <Card key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <DriftBadge level={r.drift_level} size="sm" />
                  <span className="text-lg font-semibold text-ink-muted">{r.drift_score}</span>
                </div>
                <p className="text-sm text-ink leading-relaxed">{r.situation_summary}</p>
                <p className="text-sm text-ink-muted italic leading-relaxed">{r.emotional_dynamic}</p>
                <div className="pt-3 border-t border-border space-y-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Message (Direct)</p>
                    <p className="text-sm text-ink italic">"{r.say_direct}"</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Action</p>
                    <p className="text-sm text-ink-muted">{r.do}</p>
                  </div>
                  {r.what_not_to_do && (
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">What Not To Do</p>
                      <p className="text-sm text-ink-muted">{r.what_not_to_do}</p>
                    </div>
                  )}
                  {r.follow_up_question && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Follow-up Asked</p>
                      <p className="text-sm text-ink-muted italic">{r.follow_up_question}</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          }

          if (parsed.type === "followup") {
            const r = parsed.data as FollowUpResponse;
            return (
              <Card key={i} className="!bg-surface-subtle !border-border-subtle">
                <p className="text-sm text-ink leading-relaxed">{r.perspective}</p>
                {r.follow_up_question && (
                  <p className="text-sm text-ink-muted italic mt-2 pt-2 border-t border-border">{r.follow_up_question}</p>
                )}
              </Card>
            );
          }

          return (
            <Card key={i} className="!bg-surface-subtle !border-border-subtle">
              <p className="text-sm text-ink-muted">{msg.content}</p>
            </Card>
          );
        })}
      </div>

      <Link href="/analyze">
        <button className="w-full h-12 border border-border rounded-2xl text-sm text-ink-muted font-medium mt-2">
          Back to Analyze
        </button>
      </Link>
    </div>
  );
}

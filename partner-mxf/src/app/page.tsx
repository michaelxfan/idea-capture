import Link from "next/link";
import { fetchRecentLogs, fetchProfile, fetchConversations } from "@/lib/db";
import {
  buildRecommendation,
  computeConfidence,
  buildTodayObjective,
  buildWhatNotToDo,
  buildWhyFitsProfile,
  getLastMeaningful,
  getLastProactive,
} from "@/lib/drift";
import DriftBadge from "@/components/DriftBadge";
import Card, { SectionLabel, StatPill } from "@/components/Card";
import TodayCopyButton from "@/components/TodayCopyButton";

const driftScoreColor: Record<string, string> = {
  solid: "text-solid",
  "light-drift": "text-light-drift",
  noticeable: "text-noticeable",
  friction: "text-friction",
};

const confidenceColors = {
  low: "text-friction bg-friction-bg border-friction-border",
  medium: "text-light-drift bg-light-drift-bg border-light-drift-border",
  high: "text-solid bg-solid-bg border-solid-border",
};

export default async function TodayPage() {
  const [logs, profile, conversations] = await Promise.all([
    fetchRecentLogs(14),
    fetchProfile(),
    fetchConversations(20),
  ]);

  const rec = buildRecommendation(logs);
  const confidence = computeConfidence(logs.length, conversations.length);
  const lastMeaningful = getLastMeaningful(logs);
  const lastProactive = getLastProactive(logs);
  const today = new Date().toISOString().split("T")[0];
  const loggedToday = logs.some((l) => l.log_date === today);
  const partnerName = profile?.name || "Your partner";
  const objective = buildTodayObjective(rec.drift_level);
  const whatNotToDo = buildWhatNotToDo(rec.drift_level);
  const whyFits = buildWhyFitsProfile(rec.drift_level, partnerName);
  const scoreColor = driftScoreColor[rec.drift_level];

  const hasEnoughData = logs.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            {profile?.name ? `With ${profile.name}` : "Relationship"}
          </h1>
        </div>
        <Link href="/log">
          <span className="inline-flex h-10 px-4 items-center bg-ink text-surface rounded-full text-sm font-medium tracking-wide">
            {loggedToday ? "Update" : "Log Today"}
          </span>
        </Link>
      </div>

      {/* No data state */}
      {!hasEnoughData && (
        <Card className="!bg-surface-subtle !border-border-subtle text-center !py-8">
          <p className="text-sm font-medium text-ink mb-1">No logs yet</p>
          <p className="text-sm text-ink-muted mb-4">Log a few days to activate drift scoring and recommendations.</p>
          <Link href="/log">
            <span className="inline-flex h-11 px-6 items-center bg-ink text-surface rounded-full text-sm font-medium">
              Log Today — 60 sec
            </span>
          </Link>
        </Card>
      )}

      {hasEnoughData && (
        <>
          {/* Current State */}
          <Card className="!p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-2">Current State</p>
                <DriftBadge level={rec.drift_level} size="md" />
              </div>
              <div className="text-right">
                <p className={`text-4xl font-semibold tracking-tight ${scoreColor}`}>{rec.drift_score}</p>
                <p className="text-[11px] text-ink-subtle uppercase tracking-widest">Drift Score</p>
              </div>
            </div>

            <p className="text-sm text-ink-muted leading-relaxed mb-4">
              <span className="font-medium text-ink">Signal: </span>{rec.why}
            </p>

            {/* Confidence */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium ${confidenceColors[confidence.level]}`}>
              <span>{confidence.label}</span>
              <span className="opacity-60">·</span>
              <span className="font-normal opacity-80">{confidence.reason}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-border">
              <StatPill label="Last Connection" value={lastMeaningful ?? "Not logged"} />
              <StatPill label="Last Proactive" value={lastProactive ?? "Not logged"} />
            </div>
          </Card>

          {/* Decision Section */}
          <Card className="space-y-4">
            {/* Objective */}
            <div>
              <SectionLabel>Today&apos;s Objective</SectionLabel>
              <p className="text-sm font-medium text-ink leading-relaxed">{objective}</p>
            </div>

            {/* Recommended Action */}
            <div className="pt-3 border-t border-border">
              <SectionLabel>Recommended Action</SectionLabel>
              <p className="text-sm text-ink-muted leading-relaxed">{rec.do}</p>
            </div>

            {/* Recommended Message */}
            <div className="pt-3 border-t border-border">
              <SectionLabel>Recommended Message</SectionLabel>
              <blockquote className="text-sm text-ink leading-relaxed italic border-l-2 border-border pl-3 mb-3">
                &ldquo;{rec.say_direct}&rdquo;
              </blockquote>
              <TodayCopyButton message={rec.say_direct} />
              <Link href="/messages">
                <p className="text-[11px] text-ink-subtle mt-2 underline underline-offset-2">See all 3 tones →</p>
              </Link>
            </div>

            {/* What Not To Do */}
            <div className="pt-3 border-t border-border">
              <SectionLabel>What Not To Do</SectionLabel>
              <p className="text-sm text-ink-muted leading-relaxed">{whatNotToDo}</p>
            </div>

            {/* Why */}
            <div className="pt-3 border-t border-border">
              <SectionLabel>Why This Fits</SectionLabel>
              <p className="text-sm text-ink-muted leading-relaxed">{whyFits}</p>
            </div>

            {/* Guardrail */}
            {rec.guardrail && (
              <div className="pt-3 border-t border-border">
                <SectionLabel>Guardrail</SectionLabel>
                <p className="text-sm text-ink-muted leading-relaxed">{rec.guardrail}</p>
              </div>
            )}

            {/* Ethical framing */}
            <p className="text-[11px] text-ink-subtle pt-2 border-t border-border leading-relaxed">
              Pattern-based suggestions, not certainties. Use them to communicate better, not to avoid direct conversation.
            </p>
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/analyze" className="block">
              <div className="bg-surface border border-border rounded-2xl p-4 h-full shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Analyze</p>
                <p className="text-sm font-medium text-ink">Deep Situation Read</p>
              </div>
            </Link>
            <Link href="/messages" className="block">
              <div className="bg-surface border border-border rounded-2xl p-4 h-full shadow-card">
                <p className="text-[11px] uppercase tracking-widest text-ink-subtle font-medium mb-1">Messages</p>
                <p className="text-sm font-medium text-ink">3 Calibrated Options</p>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* Log CTA if not logged today */}
      {hasEnoughData && !loggedToday && (
        <Card className="!bg-surface-subtle !border-border-subtle text-center !py-5">
          <p className="text-sm text-ink-muted mb-3">Log today to keep your drift score accurate.</p>
          <Link href="/log">
            <span className="inline-flex h-11 px-6 items-center bg-ink text-surface rounded-full text-sm font-medium">
              Quick Log — 60 sec
            </span>
          </Link>
        </Card>
      )}
    </div>
  );
}

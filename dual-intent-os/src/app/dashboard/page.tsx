"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import SplitSummaryCard from "@/components/SplitSummaryCard";
import DailyCoachCard from "@/components/DailyCoachCard";
import TodayModeCard from "@/components/TodayModeCard";
import ThresholdTimeline from "@/components/ThresholdTimeline";
import IntentAccuracyCard from "@/components/IntentAccuracyCard";
import PatternInsightsCard from "@/components/PatternInsightsCard";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmptyState from "@/components/EmptyState";
import WhoopBar from "@/components/WhoopBar";
import { useCaptures } from "@/lib/useStore";
import {
  classifyDay,
  detectThresholdPatterns,
  analyzeIntentAccuracy,
  detectDrift,
  generatePatternInsights,
  getDayContext,
} from "@/lib/analysis";
import type { Capture, WhoopData } from "@/types";

interface WhoopState {
  recoveryScore: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  sleepHours: number | null;
  sleepPerformance: number | null;
  connected: boolean;
  loading: boolean;
}

function onlyToday(captures: Capture[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return captures.filter((c) => new Date(c.created_at) >= start);
}

export default function DashboardPage() {
  const { captures, hydrated } = useCaptures();

  const today = useMemo(() => onlyToday(captures), [captures]);

  const dayContext = useMemo(() => getDayContext(), []);

  const [whoop, setWhoop] = useState<WhoopState>({
    recoveryScore: null,
    hrv: null,
    restingHeartRate: null,
    sleepHours: null,
    sleepPerformance: null,
    connected: false,
    loading: true,
  });

  useEffect(() => {
    fetch("/api/whoop-recovery")
      .then((r) => r.json())
      .then((d) => {
        setWhoop({
          recoveryScore: d.recoveryScore ?? null,
          hrv: d.hrv ?? null,
          restingHeartRate: d.restingHeartRate ?? null,
          sleepHours: d.sleepHours ?? null,
          sleepPerformance: d.sleepPerformance ?? null,
          connected: !!d.connected,
          loading: false,
        });
      })
      .catch(() => {
        setWhoop((s) => ({ ...s, loading: false }));
      });
  }, []);

  const whoopData = useMemo<WhoopData | null>(() => {
    if (!whoop.connected || whoop.recoveryScore === null) return null;
    return {
      recovery_pct: whoop.recoveryScore,
      sleep_hours: whoop.sleepHours,
      hrv: whoop.hrv,
    };
  }, [whoop]);

  const intel = useMemo(() => {
    const day = classifyDay(today, whoopData, dayContext);
    const thresholds = detectThresholdPatterns(today);
    const accuracy = analyzeIntentAccuracy(today);
    const drift = detectDrift(today);
    const insights = generatePatternInsights(today, day, thresholds, accuracy, drift);
    return { day, thresholds, accuracy, drift, insights };
  }, [today, whoopData, dayContext]);

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="h-section mb-1">{todayStr}</div>
          <h1 className="h-display">Today.</h1>
        </div>
        <Link href="/capture" className="btn-primary hidden md:inline-flex">
          + New capture
        </Link>
      </div>

      {/* WHOOP + day context bar — always visible */}
      <div className="mb-5">
        <WhoopBar
          recoveryScore={whoop.recoveryScore}
          hrv={whoop.hrv}
          restingHeartRate={whoop.restingHeartRate}
          sleepHours={whoop.sleepHours}
          sleepPerformance={whoop.sleepPerformance}
          connected={whoop.connected}
          loading={whoop.loading}
          dayContext={dayContext}
        />
      </div>

      {/* Today's mode — always visible (uses captures + WHOOP + day context) */}
      <div className="mb-5">
        <TodayModeCard classification={intel.day} dayContext={dayContext} />
      </div>

      {!hydrated ? (
        <div className="card p-8 text-sm text-ink-400">Loading…</div>
      ) : today.length === 0 ? (
        <EmptyState
          title="No captures yet today."
          body="Drop a situation — a difficult email, a workout you're about to skip, a decision you keep deferring. Twenty seconds, total."
          cta={
            <Link href="/capture" className="btn-primary">
              + Capture a situation
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* KEY INSIGHTS — always visible */}
          <div className="grid md:grid-cols-3 gap-5">
            <ThresholdTimeline patterns={intel.thresholds} />
            <IntentAccuracyCard accuracy={intel.accuracy} drift={intel.drift} />
            <PatternInsightsCard insights={intel.insights} />
          </div>

          {/* CAPTURES — collapsible */}
          <CollapsibleSection
            title={`Today's captures · ${today.length}`}
            defaultOpen={true}
          >
            <div className="space-y-3">
              {today.slice(0, 8).map((c) => (
                <SplitSummaryCard key={c.id} capture={c} />
              ))}
              {today.length > 8 && (
                <Link href="/review" className="btn-secondary">
                  View all {today.length}
                </Link>
              )}
            </div>
          </CollapsibleSection>

          {/* COACH — collapsible */}
          <CollapsibleSection title="Coach" defaultOpen={false}>
            <DailyCoachCard captures={today} />
          </CollapsibleSection>

          <div className="md:hidden">
            <Link href="/capture" className="btn-primary w-full">
              + New capture
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import type { FocusLevel, DayContext } from "@/lib/analysis";
import type { TimeOfDayBucket } from "@/types";

interface WhoopBarProps {
  recoveryScore: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  sleepHours: number | null;
  sleepPerformance: number | null;
  connected: boolean;
  loading: boolean;
  dayContext: DayContext;
}

function RecoveryRing({ score, size = 48 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = score >= 67 ? "#22c55e" : score >= 33 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ display: "block", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke="var(--color-ink-100, #e5e5e5)" strokeWidth={strokeWidth}
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.26, fontWeight: 700, color, lineHeight: 1,
      }}>
        {score}
      </div>
    </div>
  );
}

const FOCUS_BADGE: Record<FocusLevel, { label: string; cls: string }> = {
  High:   { label: "High focus",   cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  Medium: { label: "Medium focus", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  Low:    { label: "Low focus",    cls: "bg-sky-50 text-sky-700 border border-sky-200" },
};

const TIME_LABEL: Record<TimeOfDayBucket, string> = {
  morning:   "Morning",
  midday:    "Midday",
  afternoon: "Afternoon",
  evening:   "Evening",
  night:     "Night",
};

export default function WhoopBar({
  recoveryScore,
  hrv,
  restingHeartRate,
  sleepHours,
  sleepPerformance,
  connected,
  loading,
  dayContext,
}: WhoopBarProps) {
  const focus = FOCUS_BADGE[dayContext.focusLevel];

  return (
    <div className="card p-4 flex flex-wrap items-center gap-4">
      {/* Day context pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-ink-500 font-medium">{dayContext.dayOfWeek}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${focus.cls}`}>
          {focus.label}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-ink-50 text-ink-600 border border-ink-100">
          {TIME_LABEL[dayContext.timeOfDay]}
        </span>
      </div>

      <div className="h-4 w-px bg-ink-100 hidden sm:block" />

      {/* WHOOP section */}
      {loading ? (
        <span className="text-xs text-ink-400">Loading WHOOP…</span>
      ) : !connected ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-400">WHOOP not connected</span>
          <Link
            href="/api/whoop/connect"
            className="text-[11px] px-2.5 py-1 rounded-full bg-ink-900 text-paper font-medium hover:bg-ink-700 transition"
          >
            Connect
          </Link>
        </div>
      ) : recoveryScore === null ? (
        <span className="text-xs text-ink-400">No WHOOP data today</span>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <RecoveryRing score={recoveryScore} size={48} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {hrv !== null && (
              <span className="text-ink-600">HRV <span className="font-semibold text-ink-900">{hrv}ms</span></span>
            )}
            {restingHeartRate !== null && (
              <span className="text-ink-600">RHR <span className="font-semibold text-ink-900">{restingHeartRate}bpm</span></span>
            )}
            {sleepHours !== null && (
              <span className="text-ink-600">Sleep <span className="font-semibold text-ink-900">{sleepHours}h</span></span>
            )}
            {sleepPerformance !== null && (
              <span className="text-ink-600">Quality <span className="font-semibold text-ink-900">{sleepPerformance}%</span></span>
            )}
          </div>
          <Link
            href="/api/whoop/disconnect"
            className="ml-auto text-[10px] text-ink-400 hover:text-ink-600 transition"
          >
            Disconnect
          </Link>
        </div>
      )}
    </div>
  );
}

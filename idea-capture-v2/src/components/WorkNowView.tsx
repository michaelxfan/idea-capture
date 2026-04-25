"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { ASSIGNEES } from "@/lib/assignees";
import {
  BatchSuggestion,
  NormalizedTask,
  Preference,
  RecommendationResult,
  ScoredTask,
  classifyTimeOfDay,
  recommend,
  timeOfDayLabel,
} from "@/lib/recommend";

/* ───────── Styles — reuse app design tokens ───────── */

const styles = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    boxShadow: "var(--shadow)",
    overflow: "hidden",
    width: "100%",
  } as CSSProperties,

  fieldLabel: {
    fontSize: "0.58rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-tertiary)",
    fontWeight: 500,
    fontFamily: "var(--font-body)",
  } as CSSProperties,

  select: {
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    padding: "7px 10px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    background: "var(--surface)",
    color: "var(--text-primary)",
    outline: "none",
    cursor: "pointer",
    minHeight: 34,
    width: "100%",
  } as CSSProperties,

  primaryButton: (disabled: boolean): CSSProperties => ({
    fontFamily: "var(--font-body)",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    background: disabled ? "var(--border)" : "var(--accent)",
    color: disabled ? "var(--text-tertiary)" : "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.02em",
    minHeight: 36,
  }),

  ghostButton: {
    fontFamily: "var(--font-body)",
    fontSize: "0.72rem",
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    minHeight: 30,
  } as CSSProperties,

  pill: (tone: "accent" | "muted" | "warn" = "muted"): CSSProperties => {
    const map = {
      accent: { bg: "var(--michael-bg)", color: "var(--michael-text)" },
      muted: { bg: "var(--later-bg)", color: "var(--later-text)" },
      warn: { bg: "var(--high-bg)", color: "var(--high-text)" },
    };
    const c = map[tone];
    return {
      fontSize: "0.62rem",
      padding: "3px 9px",
      borderRadius: 20,
      fontWeight: 500,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
      background: c.bg,
      color: c.color,
      fontFamily: "var(--font-body)",
      display: "inline-block",
    };
  },

  sectionHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "1.05rem",
    fontWeight: 400,
    color: "var(--text-primary)",
    marginBottom: 8,
  } as CSSProperties,

  subLabel: {
    fontSize: "0.68rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-tertiary)",
    fontWeight: 500,
    fontFamily: "var(--font-body)",
    marginBottom: 8,
  } as CSSProperties,
};

/* ───────── Recovery ring ───────── */

function RecoveryRing({ score, size = 52 }: { score: number; size?: number }) {
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color =
    score >= 67 ? "#22c55e" : score >= 33 ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ display: "block", transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      {/* Score label — un-rotated overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-body)",
          fontSize: size * 0.24,
          fontWeight: 700,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {score}
      </div>
    </div>
  );
}

/* ───────── Types ───────── */

interface ExplainPayload {
  whyNow: string;
  firstStep: string;
  nextSteps: string[];
  blockersToCheck: string[];
  timebox: string;
}

/* ───────── WHOOP connect URL — env-aware ───────── */
// Local dev: reuse TAOS (redirect URI already registered at localhost:3000)
// Production: use our own OAuth route (requires Vercel callback URI registered)
function whoopConnectUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000/auth/whoop";
  }
  return "/api/whoop/connect";
}

/* ───────── Tier auto-selection ───────── */

const TIER_ORDER: Preference[] = ["quick-wins", "balanced", "strategic"]; // ascending capability

function tierForTimeOfDay(tod: ReturnType<typeof classifyTimeOfDay>): Preference {
  if (tod === "early-morning" || tod === "late-morning") return "strategic";      // Tier 1
  if (tod === "early-afternoon" || tod === "late-afternoon") return "quick-wins"; // Tier 3
  return "balanced"; // evening, night → Tier 2
}

/** Recovery score (0-100) caps the tier ceiling. Low recovery → quick-wins. */
function effectiveTier(tod: ReturnType<typeof classifyTimeOfDay>, recovery: number | null): Preference {
  const timeTier = tierForTimeOfDay(tod);
  if (recovery === null) return timeTier;
  const timeTierIdx = TIER_ORDER.indexOf(timeTier);
  const maxIdx = recovery < 33 ? 0 : recovery < 67 ? 1 : 2;
  return TIER_ORDER[Math.min(timeTierIdx, maxIdx)];
}

/* ───────── localStorage helpers ───────── */

const SNOOZE_KEY = "work-now-snoozed";
const DEFERRAL_KEY = "work-now-deferrals";
const today = () => new Date().toISOString().slice(0, 10);

function loadSnoozed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SNOOZE_KEY);
    if (!raw) return new Set();
    const parsed: Record<string, string> = JSON.parse(raw);
    const todayStr = today();
    return new Set(Object.entries(parsed).filter(([, d]) => d === todayStr).map(([id]) => id));
  } catch { return new Set(); }
}

function saveSnoozed(s: Set<string>) {
  if (typeof window === "undefined") return;
  const todayStr = today();
  const obj: Record<string, string> = {};
  s.forEach((id) => { obj[id] = todayStr; });
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(obj));
}

function loadDeferrals(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DEFERRAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDeferrals(d: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEFERRAL_KEY, JSON.stringify(d));
}

/* ───────── Main component ───────── */

const BOARD_OPTIONS = [
  { value: "all", label: "All boards" },
  { value: "GH", label: "GH" },
  { value: "Personal", label: "Personal" },
  { value: "Innovative", label: "Innovative" },
];

export default function WorkNowView() {
  const [assignee, setAssignee] = useState<string>(ASSIGNEES[0]?.name || "Michael");
  const [board, setBoard] = useState<string>("all");
  const [timeAvailable, setTimeAvailable] = useState<string>("any");
  const [preference, setPreference] = useState<Preference>(() =>
    effectiveTier(classifyTimeOfDay(new Date()), null)
  );
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mock, setMock] = useState(false);
  const [fetchErrors, setFetchErrors] = useState<string[] | null>(null);

  // WHOOP / recovery
  const [recoveryScore, setRecoveryScore] = useState<number | null>(null);
  const [recoveryHrv, setRecoveryHrv] = useState<number | null>(null);
  const [recoveryRhr, setRecoveryRhr] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [sleepPerformance, setSleepPerformance] = useState<number | null>(null);
  const [recoverySource, setRecoverySource] = useState<"whoop" | "none">("none");
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [whoopNotice, setWhoopNotice] = useState<"connected" | "error" | "disconnected" | null>(null);
  const [manualRecovery, setManualRecovery] = useState<string>("");

  // Snooze & deferrals (localStorage-backed)
  const [snoozed, setSnoozed] = useState<Set<string>>(() => loadSnoozed());
  const [deferrals, setDeferrals] = useState<Record<string, number>>(() => loadDeferrals());

  const [tasks, setTasks] = useState<NormalizedTask[] | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [explain, setExplain] = useState<ExplainPayload | null>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [showingBackupId, setShowingBackupId] = useState<string | null>(null);

  // Live time-of-day badge (updates every minute)
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(iv);
  }, []);
  const currentTod = useMemo(() => classifyTimeOfDay(now), [now]);
  const currentTodLabel = useMemo(() => timeOfDayLabel(currentTod), [currentTod]);

  // Detect ?whoop= query param from OAuth callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const wp = params.get("whoop");
    if (wp === "connected" || wp === "error" || wp === "disconnected") {
      setWhoopNotice(wp as "connected" | "error" | "disconnected");
      // Clean URL without reload
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

  // Fetch WHOOP recovery on mount (and re-fetch after connect)
  const fetchWhoopRecovery = () => {
    fetch("/api/whoop-recovery")
      .then((r) => r.json())
      .then((d) => {
        setWhoopConnected(!!d.connected);
        if (d.recoveryScore !== null) {
          setRecoveryScore(d.recoveryScore);
          setRecoveryHrv(d.hrv ?? null);
          setRecoveryRhr(d.restingHeartRate ?? null);
          setSleepHours(d.sleepHours ?? null);
          setSleepPerformance(d.sleepPerformance ?? null);
          setRecoverySource("whoop");
        } else {
          setRecoverySource("none");
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchWhoopRecovery();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive effective recovery: WHOOP takes priority, then manual input
  const effectiveRecovery = useMemo(() => {
    if (recoverySource === "whoop" && recoveryScore !== null) return recoveryScore;
    const m = parseInt(manualRecovery, 10);
    return !isNaN(m) && m >= 0 && m <= 100 ? m : null;
  }, [recoveryScore, recoverySource, manualRecovery]);

  // Auto-update tier when time-of-day or recovery changes
  useEffect(() => {
    setPreference(effectiveTier(currentTod, effectiveRecovery));
  }, [currentTod, effectiveRecovery]);

  // Re-score tasks whenever preference or time-available changes
  useEffect(() => {
    if (!tasks) return;
    const minutes = timeAvailable === "any" ? null : parseInt(timeAvailable, 10);
    const r = recommend(tasks, { preference, now: new Date(), timeAvailable: minutes, snoozedIds: [...snoozed] });
    setResult(r);
    setExplain(null);
    setShowingBackupId(null);
    if (r.top) fetchExplanation(r.top, r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference, tasks, timeAvailable, snoozed]);

  async function handleRecommend(refresh = false) {
    // Track deferral: if re-recommending and there was a top task, count it as skipped
    if (result?.top) {
      const skippedId = result.top.task.id;
      const updated = { ...deferrals, [skippedId]: (deferrals[skippedId] ?? 0) + 1 };
      setDeferrals(updated);
      saveDeferrals(updated);
    }

    setLoading(true);
    setError(null);
    setExplain(null);
    setShowingBackupId(null);
    if (!refresh) setResult(null);
    try {
      const res = await fetch("/api/clickup-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee, board: board === "all" ? undefined : board }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error: ${res.status}`);

      setMock(!!data.mock);
      setFetchErrors(Array.isArray(data.errors) ? data.errors : null);
      const fetched: NormalizedTask[] = data.tasks || [];
      setTasks(fetched);

      const minutes = timeAvailable === "any" ? null : parseInt(timeAvailable, 10);
      const r = recommend(fetched, { preference, now: new Date(), timeAvailable: minutes, snoozedIds: [...snoozed] });
      setResult(r);

      if (r.top) {
        fetchExplanation(r.top, r);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }

  function snoozeTask(id: string) {
    const updated = new Set(snoozed);
    updated.add(id);
    setSnoozed(updated);
    saveSnoozed(updated);
  }

  async function fetchExplanation(target: ScoredTask, r: RecommendationResult) {
    setExplaining(true);

    // Fetch latest comment in parallel with nothing blocking — fire and forget into the explain call
    let latestComment: string | null = null;
    try {
      if (target.task.id && !target.task.id.startsWith("mock-")) {
        const cRes = await fetch("/api/task-comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: target.task.id }),
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          latestComment = cData.latestComment ?? null;
        }
      }
    } catch { /* silently ignore */ }

    try {
      const res = await fetch("/api/work-now-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: target.task,
          timeOfDay: r.timeOfDay,
          timeOfDayLabel: r.timeOfDayLabel,
          preference,
          breakdown: target.breakdown,
          latestComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setExplain({
          whyNow: data.whyNow || r.explanation,
          firstStep: data.firstStep || "",
          nextSteps: data.nextSteps || [],
          blockersToCheck: data.blockersToCheck || [],
          timebox: data.timebox || "",
        });
      } else {
        setExplain({
          whyNow: r.explanation,
          firstStep: "",
          nextSteps: [],
          blockersToCheck: [],
          timebox: "",
        });
      }
    } catch {
      setExplain({
        whyNow: r.explanation,
        firstStep: "",
        nextSteps: [],
        blockersToCheck: [],
        timebox: "",
      });
    } finally {
      setExplaining(false);
    }
  }

  function selectBackup(backup: ScoredTask) {
    if (!result) return;
    setShowingBackupId(backup.task.id);
    fetchExplanation(backup, result);
  }

  function backToTop() {
    if (!result || !result.top) return;
    setShowingBackupId(null);
    fetchExplanation(result.top, result);
  }

  const activeScored: ScoredTask | null = useMemo(() => {
    if (!result) return null;
    if (showingBackupId) {
      return result.all.find((s) => s.task.id === showingBackupId) || result.top;
    }
    return result.top;
  }, [result, showingBackupId]);

  return (
    <div>
      {/* WHOOP OAuth notice */}
      {whoopNotice && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 6,
            border: `1px solid ${whoopNotice === "connected" ? "#bbf7d0" : whoopNotice === "disconnected" ? "var(--border)" : "#fecaca"}`,
            background:
              whoopNotice === "connected"
                ? "#f0fdf4"
                : whoopNotice === "disconnected"
                ? "var(--border-light)"
                : "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontFamily: "var(--font-body)",
              color:
                whoopNotice === "connected"
                  ? "#15803d"
                  : whoopNotice === "disconnected"
                  ? "var(--text-secondary)"
                  : "#b91c1c",
            }}
          >
            {whoopNotice === "connected"
              ? "✓ WHOOP connected — recovery data loaded"
              : whoopNotice === "disconnected"
              ? "WHOOP disconnected"
              : "⚠ WHOOP connection failed — check that the redirect URI is registered in your WHOOP developer app"}
          </span>
          <button
            onClick={() => setWhoopNotice(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              fontSize: "0.75rem",
              padding: "0 4px",
              fontFamily: "var(--font-body)",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls */}
      <section style={{ marginBottom: 24 }}>
        <div className="section-label">Controls</div>
        <div style={{ ...styles.card, padding: 14 }}>
          {/* Row 1: Assignee / Board / Mode / Time available */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.fieldLabel}>Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                style={styles.select}
              >
                {ASSIGNEES.map((a) => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.fieldLabel}>Board</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                style={styles.select}
              >
                {BOARD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.fieldLabel}>Mode</label>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value as Preference)}
                style={styles.select}
              >
                <option value="strategic">Tier 1 hours</option>
                <option value="balanced">Tier 2 hours</option>
                <option value="quick-wins">Tier 3 hours</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.fieldLabel}>Time available</label>
              <select
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
                style={styles.select}
              >
                <option value="any">Any</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>

          {/* Row 2: Recovery / WHOOP */}
          <div
            style={{
              marginBottom: 10,
              padding: "10px 12px",
              border: "1px solid var(--border-light)",
              borderRadius: 6,
              background: "var(--bg)",
            }}
          >
            {recoverySource === "whoop" && recoveryScore !== null ? (
              /* ── Connected + data ── */
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <RecoveryRing score={recoveryScore} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color:
                        recoveryScore >= 67
                          ? "#22c55e"
                          : recoveryScore >= 33
                          ? "#f59e0b"
                          : "#ef4444",
                      lineHeight: 1.3,
                    }}
                  >
                    {recoveryScore >= 67
                      ? "High recovery"
                      : recoveryScore >= 33
                      ? "Medium recovery"
                      : "Low recovery"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.65rem",
                      color: "var(--text-tertiary)",
                      marginTop: 2,
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      WHOOP
                      {recoveryHrv !== null && ` · HRV ${recoveryHrv} ms`}
                      {recoveryRhr !== null && ` · RHR ${recoveryRhr} bpm`}
                    </div>
                    {(sleepHours !== null || sleepPerformance !== null) && (
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sleepHours !== null && `${sleepHours}h sleep`}
                        {sleepHours !== null && sleepPerformance !== null && " · "}
                        {sleepPerformance !== null && `${sleepPerformance}% quality`}
                      </div>
                    )}
                  </div>
                </div>
                <a
                  href="/api/whoop/disconnect"
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--text-secondary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-tertiary)")
                  }
                >
                  Disconnect
                </a>
              </div>
            ) : whoopConnected ? (
              /* ── Connected but no data today ── */
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={styles.fieldLabel}>Recovery</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                    flex: 1,
                  }}
                >
                  WHOOP connected — no data yet today
                </span>
                <a
                  href="/api/whoop/disconnect"
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                    textDecoration: "none",
                  }}
                >
                  Disconnect
                </a>
              </div>
            ) : (
              /* ── Not connected ── */
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  rowGap: 8,
                }}
              >
                <span style={{ ...styles.fieldLabel, flexShrink: 0 }}>Recovery</span>
                <a
                  href={whoopConnectUrl()}
                  target={whoopConnectUrl().startsWith("http://localhost") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 6,
                    background: "#1a1a2e",
                    color: "#fff",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  ⚡ Connect WHOOP
                </a>
                {/* divider */}
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  or
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0–100"
                  value={manualRecovery}
                  onChange={(e) => setManualRecovery(e.target.value)}
                  style={{
                    ...styles.select,
                    width: 76,
                    padding: "5px 8px",
                    fontSize: "0.78rem",
                    flexShrink: 0,
                  }}
                />
                {effectiveRecovery !== null ? (
                  <span
                    style={{
                      ...styles.pill(
                        effectiveRecovery >= 67
                          ? "accent"
                          : effectiveRecovery >= 33
                          ? "muted"
                          : "warn"
                      ),
                      fontSize: "0.65rem",
                    }}
                  >
                    {effectiveRecovery >= 67
                      ? "High"
                      : effectiveRecovery >= 33
                      ? "Med"
                      : "Low"}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-body)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    manual
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => handleRecommend(false)}
              disabled={loading}
              style={styles.primaryButton(loading)}
            >
              {loading
                ? "Thinking..."
                : result
                ? "Recommend again"
                : "Recommend what to work on"}
            </button>
            {result && (
              <button
                onClick={() => handleRecommend(true)}
                disabled={loading}
                style={styles.ghostButton}
                title="Refresh recommendation with latest tasks"
              >
                Refresh
              </button>
            )}
            <span style={{ ...styles.pill("accent"), marginLeft: "auto" }}>
              {currentTodLabel}
            </span>
          </div>

          {mock && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "#f5f0e0",
                border: "1px solid #d4c49a",
                borderRadius: 6,
                fontSize: "0.7rem",
                color: "#8b6b2a",
                fontFamily: "var(--font-body)",
              }}
            >
              Mock data — set CLICKUP_API_TOKEN to hit real ClickUp.
            </div>
          )}

          {fetchErrors && fetchErrors.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "#fdf5f0",
                border: "1px solid #e8c4b0",
                borderRadius: 6,
                fontSize: "0.7rem",
                color: "#8b4a2a",
                fontFamily: "var(--font-body)",
              }}
            >
              Partial fetch errors: {fetchErrors.join("; ")}
            </div>
          )}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "#fdf5f0",
            border: "1px solid #e8c4b0",
            borderRadius: 6,
            fontSize: "0.78rem",
            color: "#8b4a2a",
            fontFamily: "var(--font-body)",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "32px 0",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--text-tertiary)",
                  animation: `bounce-dot 1.4s ${i * 0.16}s infinite ease-in-out both`,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Scanning tasks...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && result && !result.top && (
        <div
          style={{
            ...styles.card,
            padding: 24,
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            fontFamily: "var(--font-body)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>✓</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", marginBottom: 4 }}>
            Nothing actionable right now
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
            No open tasks found for {assignee}. Enjoy the quiet — or capture a new idea in the other tab.
          </div>
        </div>
      )}

      {/* Batch suggestion */}
      {!loading && result?.batchSuggestion && !showingBackupId && (
        <div style={{ marginBottom: 16 }}>
          <BatchCard batch={result.batchSuggestion} deferrals={deferrals} onSnooze={snoozeTask} />
        </div>
      )}

      {/* Recommendation */}
      {!loading && result && activeScored && (
        <section>
          {/* Toggle banner when viewing a backup */}
          {showingBackupId && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 12px",
                background: "var(--border-light)",
                borderRadius: 6,
                fontSize: "0.72rem",
                fontFamily: "var(--font-body)",
                color: "var(--text-secondary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Viewing a backup option</span>
              <button
                onClick={backToTop}
                style={{
                  ...styles.ghostButton,
                  padding: "4px 8px",
                  fontSize: "0.68rem",
                  minHeight: 24,
                }}
              >
                ← Back to top pick
              </button>
            </div>
          )}

          {/* Recommended task card */}
          <RecommendedCard
            scored={activeScored}
            explain={explain}
            explaining={explaining}
            deferralCount={deferrals[activeScored.task.id] ?? 0}
            onSnooze={() => snoozeTask(activeScored.task.id)}
          />

          {/* Backups */}
          {result.backups.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={styles.subLabel}>Backup options</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.backups.map((b) => (
                  <BackupRow
                    key={b.task.id}
                    scored={b}
                    active={showingBackupId === b.task.id}
                    deferralCount={deferrals[b.task.id] ?? 0}
                    onSelect={() => selectBackup(b)}
                    onSnooze={() => snoozeTask(b.task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Meta / score breakdown */}
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setMetaOpen(!metaOpen)}
              style={{
                width: "100%",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "1px solid var(--border-light)",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                color: "var(--text-tertiary)",
                letterSpacing: "0.03em",
              }}
            >
              <span
                style={{
                  fontSize: "0.55rem",
                  transition: "transform 0.2s",
                  transform: metaOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ▶
              </span>
              {metaOpen ? "Hide" : "Show"} score breakdown & metadata
            </button>
            {metaOpen && (
              <MetadataPanel
                scored={activeScored}
                result={result}
                preference={preference}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* ───────── Recommended card ───────── */

function RecommendedCard({
  scored,
  explain,
  explaining,
  deferralCount,
  onSnooze,
}: {
  scored: ScoredTask;
  explain: ExplainPayload | null;
  explaining: boolean;
  deferralCount: number;
  onSnooze: () => void;
}) {
  const { task } = scored;
  return (
    <div style={styles.card}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 6,
          }}
        >
          <span style={styles.pill("accent")}>Recommended</span>
          {task.listName && <span style={styles.pill()}>{task.listName}</span>}
          {task.isBlocked && <span style={styles.pill("warn")}>Possibly blocked</span>}
          {deferralCount >= 2 && (
            <span style={styles.pill("warn")}>skipped {deferralCount}×</span>
          )}
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            fontWeight: 400,
            color: "var(--text-primary)",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {task.name}
        </h2>
        <MetaRow task={task} />
      </div>

      {/* Why now */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)" }}>
        <div style={styles.subLabel}>Why now</div>
        {explaining && !explain ? (
          <LoadingDots label="Thinking..." />
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              lineHeight: 1.65,
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {explain?.whyNow || scored.shortReason}
          </p>
        )}
      </div>

      {/* How to do it */}
      <div style={{ padding: "12px 16px" }}>
        <div style={styles.subLabel}>How to do it</div>
        {explaining && !explain ? (
          <LoadingDots label="Drafting plan..." />
        ) : explain ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {explain.firstStep && (
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 4 }}>First step</div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    lineHeight: 1.55,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    background: "var(--border-light)",
                    padding: "8px 10px",
                    borderRadius: 4,
                  }}
                >
                  {explain.firstStep}
                </div>
              </div>
            )}
            {explain.nextSteps.length > 0 && (
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 4 }}>Next steps</div>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {explain.nextSteps.map((s, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: "0.8rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {explain.blockersToCheck.length > 0 && (
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 4 }}>Blockers to check</div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {explain.blockersToCheck.map((b, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: "0.78rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {explain.timebox && (
              <div
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-body)",
                  color: "var(--text-tertiary)",
                }}
              >
                ⏱ Timebox: <strong style={{ color: "var(--text-secondary)" }}>{explain.timebox}</strong>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Plan will appear here after the recommendation loads.
          </div>
        )}

        {/* Accept CTA */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {task.url && (
            <>
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  padding: "9px 20px",
                  borderRadius: 6,
                  background: "var(--accent)",
                  color: "#fff",
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                  display: "inline-block",
                }}
              >
                Start this task →
              </a>
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
              >
                Open in ClickUp
              </a>
            </>
          )}
          <button
            onClick={onSnooze}
            style={{
              ...styles.ghostButton,
              marginLeft: task.url ? "auto" : 0,
              fontSize: "0.7rem",
              padding: "5px 10px",
              minHeight: 28,
            }}
            title="Hide this task for the rest of today"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Backup row ───────── */

function BackupRow({
  scored,
  active,
  deferralCount,
  onSelect,
  onSnooze,
}: {
  scored: ScoredTask;
  active: boolean;
  deferralCount: number;
  onSelect: () => void;
  onSnooze: () => void;
}) {
  const { task } = scored;
  return (
    <div
      style={{
        ...styles.card,
        padding: "10px 12px",
        border: active ? "1px solid var(--text-primary)" : "1px solid var(--border)",
        background: active ? "var(--border-light)" : "var(--surface)",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <button
        onClick={onSelect}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          padding: 0,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.88rem",
                fontWeight: 400,
                color: "var(--text-primary)",
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {task.name}
              {deferralCount >= 2 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: "0.62rem",
                    color: "var(--high-text)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  skipped {deferralCount}×
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                marginTop: 3,
                lineHeight: 1.5,
              }}
            >
              {scored.shortReason}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 20,
              background: "var(--border-light)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
            }}
          >
            {Math.round(scored.score * 100)}
          </div>
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onSnooze(); }}
        title="Hide for today"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-tertiary)",
          fontSize: "0.7rem",
          padding: "2px 4px",
          fontFamily: "var(--font-body)",
          flexShrink: 0,
          alignSelf: "center",
        }}
      >
        ✕
      </button>
    </div>
  );
}

/* ───────── Meta row ───────── */

function MetaRow({ task }: { task: NormalizedTask }) {
  const bits: string[] = [];
  bits.push(`for ${task.assignees?.[0] || "—"}`);
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    bits.push(`due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
  }
  if (task.priorityLabel) bits.push(`${task.priorityLabel} priority`);
  if (task.durationMinutes) bits.push(`~${task.durationMinutes} min`);

  return (
    <div
      style={{
        marginTop: 6,
        fontSize: "0.7rem",
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {bits.join(" · ")}
    </div>
  );
}

/* ───────── Metadata panel ───────── */

function MetadataPanel({
  scored,
  result,
  preference,
}: {
  scored: ScoredTask;
  result: RecommendationResult;
  preference: Preference;
}) {
  const rows = Object.entries(scored.breakdown).filter(([k]) => k !== "total");
  const task = scored.task;
  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        border: "1px solid var(--border-light)",
        borderRadius: 6,
        background: "var(--bg)",
      }}
    >
      <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>Score breakdown</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
        {rows.map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.72rem",
              fontFamily: "var(--font-body)",
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ width: 160, color: "var(--text-tertiary)" }}>{k}</span>
            <div
              style={{
                flex: 1,
                height: 6,
                background: "var(--border-light)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round((v as number) * 100)}%`,
                  height: "100%",
                  background: "var(--text-secondary)",
                }}
              />
            </div>
            <span style={{ width: 40, textAlign: "right" }}>{Math.round((v as number) * 100)}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          lineHeight: 1.6,
        }}
      >
        <div>Final score: <strong style={{ color: "var(--text-secondary)" }}>{Math.round(scored.score * 100)}/100</strong></div>
        <div>Time-of-day: {result.timeOfDayLabel} ({result.timeOfDay})</div>
        <div>Mode: {preference}</div>
        <div>Total candidates: {result.all.length}</div>
        <div style={{ marginTop: 6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Fields detected vs inferred:</strong>
          <div>
            priority: {task.priorityLabel ? `detected (${task.priorityLabel})` : "none"} ·
            {" "}due: {task.dueDate ? "detected" : "none"} ·
            {" "}estimate: {task.timeEstimate ? "detected" : "inferred"}
          </div>
          <div>
            activation energy: inferred ({task.activationEnergy}) · strategic: inferred ({String(task.isStrategic)}) · blocked: inferred ({String(task.isBlocked)})
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Batch card ───────── */

function BatchCard({
  batch,
  deferrals,
  onSnooze,
}: {
  batch: BatchSuggestion;
  deferrals: Record<string, number>;
  onSnooze: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const totalLabel = batch.totalMinutes
    ? `~${batch.totalMinutes} min`
    : `${batch.tasks.length} tasks`;

  return (
    <div
      style={{
        ...styles.card,
        border: "1px dashed var(--border)",
        background: "var(--border-light)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "0.8rem" }}>⚡</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            flex: 1,
          }}
        >
          Quick batch: {batch.tasks.length} low-energy tasks — {totalLabel}
        </span>
        <span
          style={{
            fontSize: "0.62rem",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-body)",
            transform: open ? "rotate(180deg)" : "none",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {batch.tasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.8rem",
                fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
              }}
            >
              <span style={{ flex: 1 }}>
                {t.name}
                {deferrals[t.id] >= 2 && (
                  <span style={{ marginLeft: 6, fontSize: "0.65rem", color: "var(--high-text)" }}>
                    skipped {deferrals[t.id]}×
                  </span>
                )}
                {t.durationMinutes && (
                  <span style={{ marginLeft: 6, fontSize: "0.68rem", color: "var(--text-tertiary)" }}>
                    {t.durationMinutes} min
                  </span>
                )}
              </span>
              {t.url && (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Open ↗
                </a>
              )}
              <button
                onClick={() => onSnooze(t.id)}
                title="Hide for today"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  fontSize: "0.7rem",
                  padding: "0 2px",
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <div
            style={{
              marginTop: 4,
              fontSize: "0.68rem",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Run these back-to-back to clear your admin queue.
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Misc helpers ───────── */

function LoadingDots({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--text-tertiary)",
              animation: `bounce-dot 1.4s ${i * 0.16}s infinite ease-in-out both`,
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: "0.72rem",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

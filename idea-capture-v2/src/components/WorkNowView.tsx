"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { ASSIGNEES } from "@/lib/assignees";
import {
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

/* ───────── Types ───────── */

interface ExplainPayload {
  whyNow: string;
  firstStep: string;
  nextSteps: string[];
  blockersToCheck: string[];
  timebox: string;
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
  const [preference, setPreference] = useState<Preference>("strategic");
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mock, setMock] = useState(false);
  const [fetchErrors, setFetchErrors] = useState<string[] | null>(null);

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

  // Re-score tasks whenever preference changes without refetching
  useEffect(() => {
    if (!tasks) return;
    const r = recommend(tasks, { preference, now: new Date() });
    setResult(r);
    setExplain(null);
    setShowingBackupId(null);
    if (r.top) fetchExplanation(r.top, r);
    // fetchExplanation is stable (defined outside effect) — excluding it from deps is safe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference, tasks]);

  async function handleRecommend(refresh = false) {
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

      const r = recommend(fetched, { preference, now: new Date() });
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

  async function fetchExplanation(target: ScoredTask, r: RecommendationResult) {
    setExplaining(true);
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
      {/* Controls */}
      <section style={{ marginBottom: 24 }}>
        <div className="section-label">Controls</div>
        <div style={{ ...styles.card, padding: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
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
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
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
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
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
                    onSelect={() => selectBackup(b)}
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
}: {
  scored: ScoredTask;
  explain: ExplainPayload | null;
  explaining: boolean;
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
        {task.url && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
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
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Backup row ───────── */

function BackupRow({
  scored,
  active,
  onSelect,
}: {
  scored: ScoredTask;
  active: boolean;
  onSelect: () => void;
}) {
  const { task } = scored;
  return (
    <button
      onClick={onSelect}
      style={{
        ...styles.card,
        padding: "10px 12px",
        cursor: "pointer",
        textAlign: "left",
        border: active ? "1px solid var(--text-primary)" : "1px solid var(--border)",
        background: active ? "var(--border-light)" : "var(--surface)",
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

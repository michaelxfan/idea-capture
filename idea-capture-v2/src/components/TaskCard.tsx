"use client";

import { CSSProperties, useState, useRef, useEffect } from "react";
import { Task, EnergyLevel, Destination } from "@/lib/types";
import { calcScore, scoreColor } from "@/lib/score";
import { buildMailtoLink } from "@/lib/mailto";
import { CLICKUP_LISTS } from "@/lib/clickup";

const ENERGY_LEVELS: EnergyLevel[] = ["low", "medium", "high"];
const DESTINATIONS: Destination[] = ["Ann", "AI", "Michael", "Later"];
const DURATIONS = ["15 min", "30 min", "45 min", "60 min", "75 min", "90 min"];

interface TaskCardProps {
  task: Task;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
  onComplete?: (id: string) => void;
}

/* ── V1-inspired style helpers ── */

const styles = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    boxShadow: "var(--shadow)",
    overflow: "hidden",
    marginBottom: 0,
    maxWidth: "100%",
  } as CSSProperties,

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 14px 10px",
    gap: 6,
    flexWrap: "wrap",
  } as CSSProperties,

  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "0.95rem",
    fontWeight: 400,
    color: "var(--text-primary)",
    border: "none",
    borderBottom: "1px solid transparent",
    background: "transparent",
    padding: "1px 0",
    outline: "none",
    lineHeight: 1.5,
    flex: 1,
    minWidth: 0,
  } as CSSProperties,

  metaRow: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
    alignItems: "center",
  } as CSSProperties,

  cardBody: {
    padding: "0 14px 14px",
  } as CSSProperties,

  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  } as CSSProperties,

  fieldRow: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  } as CSSProperties,

  fieldLabel: {
    fontSize: "0.58rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-tertiary)",
    fontWeight: 500,
    fontFamily: "var(--font-body)",
  } as CSSProperties,

  fieldSelect: {
    fontFamily: "var(--font-body)",
    fontSize: "0.68rem",
    padding: "4px 6px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    background: "var(--surface)",
    color: "var(--text-primary)",
    outline: "none",
    cursor: "pointer",
    minHeight: 28,
  } as CSSProperties,

  fieldTextarea: {
    fontFamily: "var(--font-body)",
    fontSize: "0.76rem",
    border: "none",
    borderBottom: "1px solid transparent",
    background: "transparent",
    padding: "1px 0",
    outline: "none",
    lineHeight: 1.6,
    color: "var(--text-primary)",
    width: "100%",
    resize: "none",
  } as CSSProperties,

  cardFooter: {
    borderTop: "1px solid var(--border-light)",
    padding: "10px 14px",
  } as CSSProperties,
};

/* ── Destination pill ── */

function destStyle(dest: string): CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    Ann: { bg: "var(--ann-bg)", color: "var(--ann-text)" },
    AI: { bg: "var(--ai-bg)", color: "var(--ai-text)" },
    Michael: { bg: "var(--michael-bg)", color: "var(--michael-text)" },
    Later: { bg: "var(--later-bg)", color: "var(--later-text)" },
  };
  const c = map[dest] || map.Later;
  return {
    fontSize: "0.65rem",
    padding: "3px 9px",
    borderRadius: 20,
    fontWeight: 500,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    background: c.bg,
    color: c.color,
    fontFamily: "var(--font-body)",
  };
}

/* ── Field components ── */

function Field({
  label,
  children,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.fieldRow,
        ...(fullWidth ? { gridColumn: "1 / -1" } : {}),
      }}
    >
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

/* ── Main component ── */

export default function TaskCard({ task, onUpdate, onDelete, onComplete }: TaskCardProps) {
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState(task.destination === "Ann" ? "annelmie.1452@gmail.com" : "");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [copied, setCopied] = useState(false);

  // Reasoning lazy-load state
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [reasoningLoading, setReasoningLoading] = useState(false);
  const [reasoningError, setReasoningError] = useState<string | null>(null);
  const reasoningCached = !!(task.whyRouted || task.how);

  // Original input collapsible state
  const [originalOpen, setOriginalOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  // Steps state
  const [steps, setSteps] = useState<string[] | null>(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);

  // ClickUp state
  const [clickupDropdownOpen, setClickupDropdownOpen] = useState(false);
  const [clickupSending, setClickupSending] = useState(false);
  const [clickupError, setClickupError] = useState<string | null>(null);
  const clickupRef = useRef<HTMLDivElement>(null);

  // Close ClickUp dropdown on outside click
  useEffect(() => {
    if (!clickupDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (clickupRef.current && !clickupRef.current.contains(e.target as Node)) {
        setClickupDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clickupDropdownOpen]);

  function update(fields: Partial<Task>) {
    onUpdate({ ...task, ...fields });
  }

  async function handleSendToClickUp(listId: string, listName: string) {
    setClickupSending(true);
    setClickupError(null);
    setClickupDropdownOpen(false);
    try {
      const emailBlock = task.emailContext
        ? `## Attached Email\n${task.emailContext.subject ? `**Subject:** ${task.emailContext.subject}\n` : ""}${task.emailContext.from ? `**From:** ${task.emailContext.from}\n` : ""}${task.emailContext.to ? `**To:** ${task.emailContext.to}\n` : ""}${task.emailContext.date ? `**Date:** ${task.emailContext.date}\n` : ""}\n${task.emailContext.body}\n`
        : "";

      const description = [
        emailBlock,
        task.rawInput ? `## User instruction\n${task.rawInput}\n` : "",
        task.how ? `**Next action:** ${task.how}` : "",
        task.whyRouted ? `**Why routed:** ${task.whyRouted}` : "",
        `**Duration:** ${task.duration}`,
        `**Urgency:** ${task.urgency} | **Importance:** ${task.importance}`,
        task.dueDate ? `**Due:** ${task.dueDate}` : "",
        task.imageUrl ? `**Attachment:** ${task.imageUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/clickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId,
          taskName: task.taskName,
          description,
          imageUrl: task.imageUrl || undefined,
          destination: task.destination,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error: ${res.status}`);
      }
      const data = await res.json();
      update({ clickupTaskId: data.taskId, clickupListName: listName, clickupUrl: data.url });
      // Open the ClickUp task in a new tab
      if (data.url) {
        window.open(data.url, "_blank", "noopener");
      }
    } catch (err) {
      setClickupError(err instanceof Error ? err.message : "Failed");
      // Auto-dismiss error after 4s
      setTimeout(() => setClickupError(null), 4000);
    } finally {
      setClickupSending(false);
    }
  }

  async function handleToggleReasoning() {
    // If already open, just toggle closed
    if (reasoningOpen) {
      setReasoningOpen(false);
      return;
    }
    setReasoningOpen(true);

    // If already cached, no API call needed
    if (reasoningCached) return;

    // Fetch reasoning on demand
    setReasoningLoading(true);
    setReasoningError(null);
    try {
      const res = await fetch("/api/reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Cache the result into the task
      update({ whyRouted: data.whyRouted, how: data.how });
    } catch (err) {
      setReasoningError(err instanceof Error ? err.message : "Failed to load reasoning");
    } finally {
      setReasoningLoading(false);
    }
  }

  async function handleGetSteps() {
    if (stepsOpen && steps) {
      setStepsOpen(false);
      return;
    }
    setStepsOpen(true);
    if (steps) return; // already cached

    setStepsLoading(true);
    setStepsError(null);
    try {
      const res = await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSteps(data.steps);
    } catch (err) {
      setStepsError(err instanceof Error ? err.message : "Failed to load steps");
    } finally {
      setStepsLoading(false);
    }
  }

  async function handleGenerateEmail() {
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmailDraft(data.draft);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed");
    } finally {
      setEmailLoading(false);
    }
  }

  function handleOpenInMail() {
    if (!emailDraft) return;
    // Parse subject from first line of draft
    const lines = emailDraft.split("\n");
    const subject = lines[0] || task.taskName;
    let body = lines.slice(1).join("\n").trim();

    // Append image URL if attached
    if (task.imageUrl) {
      body += `\n\nAttachment: ${task.imageUrl}`;
    }

    const link = buildMailtoLink({
      to: emailTo,
      cc: emailCc,
      bcc: emailBcc,
      subject,
      body,
    });
    window.location.href = link;
  }

  const focusBorder = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderBottomColor = "var(--border)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderBottomColor = "transparent";
    },
  };

  const score = calcScore(task);
  const sc = scoreColor(score);

  return (
    <div style={styles.card} data-task-id={task.id}>
      {/* Top: title + score + destination + timestamp */}
      <div style={styles.cardTop}>
        <input
          type="text"
          value={task.taskName}
          onChange={(e) => update({ taskName: e.target.value })}
          style={styles.cardTitle}
          {...focusBorder}
        />
        <div style={styles.metaRow}>
          {task.createdAt && (
            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap",
              }}
            >
              {new Date(task.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 20,
              letterSpacing: "0.03em",
              background: sc.bg,
              color: sc.color,
              fontFamily: "var(--font-body)",
            }}
          >
            {score}
          </span>
          <span style={destStyle(task.destination)}>{task.destination}</span>
        </div>
      </div>

      {/* Body: structured fields — row 1: destination + duration, row 2: energy + urgency + importance */}
      <div style={styles.cardBody}>
        <div className="field-grid">
          <Field label="Destination">
            <select
              value={task.destination}
              onChange={(e) =>
                update({ destination: e.target.value as Destination })
              }
              style={styles.fieldSelect}
            >
              {DESTINATIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Duration">
            <select
              value={task.duration}
              onChange={(e) => update({ duration: e.target.value })}
              style={styles.fieldSelect}
            >
              {DURATIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Due Date">
            <input
              type="date"
              value={task.dueDate || ""}
              onChange={(e) => update({ dueDate: e.target.value || undefined })}
              style={{
                ...styles.fieldSelect,
                colorScheme: "light",
              }}
            />
          </Field>

          <Field label="Activation Energy">
            <select
              value={task.activationEnergy}
              onChange={(e) =>
                update({ activationEnergy: e.target.value as EnergyLevel })
              }
              style={styles.fieldSelect}
            >
              {ENERGY_LEVELS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Urgency">
            <select
              value={task.urgency}
              onChange={(e) =>
                update({ urgency: e.target.value as EnergyLevel })
              }
              style={styles.fieldSelect}
            >
              {ENERGY_LEVELS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Importance">
            <select
              value={task.importance}
              onChange={(e) =>
                update({ importance: e.target.value as EnergyLevel })
              }
              style={styles.fieldSelect}
            >
              {ENERGY_LEVELS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Attached image */}
        {task.imageUrl && (
          <div style={{ marginTop: 10 }}>
            <a href={task.imageUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={task.imageUrl}
                alt="Attachment"
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  objectFit: "contain",
                  cursor: "pointer",
                }}
              />
            </a>
          </div>
        )}
      </div>

      {/* Original input toggle */}
      {task.rawInput && (
        <div style={{ borderTop: "1px solid var(--border-light)" }}>
          <button
            onClick={() => setOriginalOpen(!originalOpen)}
            style={{
              width: "100%",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.65rem",
              color: "var(--text-tertiary)",
              letterSpacing: "0.03em",
            }}
          >
            <span
              style={{
                fontSize: "0.5rem",
                transition: "transform 0.2s",
                transform: originalOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              &#9654;
            </span>
            Original input
          </button>
          {originalOpen && (
            <div style={{ padding: "0 14px 12px" }}>
              <pre
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  background: "var(--border-light)",
                  padding: "8px 10px",
                  borderRadius: 4,
                }}
              >
                {task.rawInput}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Attached email */}
      {task.emailContext && (
        <div style={{ borderTop: "1px solid var(--border-light)" }}>
          <button
            onClick={() => setEmailOpen(!emailOpen)}
            style={{
              width: "100%",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.65rem",
              color: "var(--text-tertiary)",
              letterSpacing: "0.03em",
            }}
          >
            <span
              style={{
                fontSize: "0.5rem",
                transition: "transform 0.2s",
                transform: emailOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              &#9654;
            </span>
            ✉ Attached email
            {task.emailContext.subject && (
              <span
                style={{
                  color: "var(--text-secondary)",
                  textTransform: "none",
                  letterSpacing: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 240,
                }}
              >
                — {task.emailContext.subject}
              </span>
            )}
          </button>
          {emailOpen && (
            <div style={{ padding: "0 14px 12px" }}>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                  marginBottom: 6,
                  lineHeight: 1.5,
                }}
              >
                {task.emailContext.from && <div>From: {task.emailContext.from}</div>}
                {task.emailContext.to && <div>To: {task.emailContext.to}</div>}
                {task.emailContext.date && (
                  <div>Date: {new Date(task.emailContext.date).toLocaleString()}</div>
                )}
              </div>
              <pre
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  background: "var(--border-light)",
                  padding: "8px 10px",
                  borderRadius: 4,
                  maxHeight: 320,
                  overflow: "auto",
                }}
              >
                {task.emailContext.body}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Reasoning toggle */}
      <div style={{ borderTop: "1px solid var(--border-light)" }}>
        <button
          onClick={handleToggleReasoning}
          style={{
            width: "100%",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "0.65rem",
            color: "var(--text-tertiary)",
            letterSpacing: "0.03em",
          }}
        >
          <span
            style={{
              fontSize: "0.5rem",
              transition: "transform 0.2s",
              transform: reasoningOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            &#9654;
          </span>
          {reasoningLoading ? "Loading reasoning..." : "Show reasoning"}
        </button>

        {reasoningOpen && (
          <div style={{ padding: "0 14px 12px" }}>
            {reasoningLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
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
            )}
            {reasoningError && (
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--high-text)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {reasoningError}
              </span>
            )}
            {!reasoningLoading && !reasoningError && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label="Why Routed Here" fullWidth>
                  <textarea
                    value={task.whyRouted || ""}
                    onChange={(e) => update({ whyRouted: e.target.value })}
                    rows={2}
                    style={styles.fieldTextarea as CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderBottomColor = "var(--border)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderBottomColor = "transparent";
                    }}
                  />
                </Field>
                <Field label="How (first step)" fullWidth>
                  <textarea
                    value={task.how || ""}
                    onChange={(e) => update({ how: e.target.value })}
                    rows={2}
                    style={styles.fieldTextarea as CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderBottomColor = "var(--border)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderBottomColor = "transparent";
                    }}
                  />
                </Field>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Steps section */}
      <div style={{ borderTop: "1px solid var(--border-light)" }}>
        <button
          onClick={handleGetSteps}
          style={{
            width: "100%",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "0.65rem",
            color: "var(--text-tertiary)",
            letterSpacing: "0.03em",
          }}
        >
          <span
            style={{
              fontSize: "0.5rem",
              transition: "transform 0.2s",
              transform: stepsOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            &#9654;
          </span>
          {stepsLoading ? "Loading steps..." : "How to complete"}
        </button>

        {stepsOpen && (
          <div style={{ padding: "0 14px 12px" }}>
            {stepsLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
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
            )}
            {stepsError && (
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--high-text)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {stepsError}
              </span>
            )}
            {!stepsLoading && !stepsError && steps && (
              <ol
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {steps.map((step, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "0.75rem",
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* Email draft */}
      {(emailDraft || emailLoading || emailError) && (
        <div
          style={{
            borderTop: "1px solid var(--border-light)",
            padding: "10px 14px",
          }}
        >
          {emailLoading && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
              }}
            >
              Drafting email...
            </span>
          )}
          {emailError && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--high-text)",
                fontFamily: "var(--font-body)",
              }}
            >
              {emailError}
            </span>
          )}
          {emailDraft && (
            <div>
              <div style={{ position: "relative" }}>
                <pre
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    margin: 0,
                  }}
                >
                  {emailDraft}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(emailDraft);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    fontSize: "0.62rem",
                    fontFamily: "var(--font-body)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: copied ? "var(--low-text)" : "var(--text-tertiary)",
                    cursor: "pointer",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Mail fields + Open in Mail */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                <input
                  type="email"
                  placeholder="to"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    padding: "5px 8px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                    minHeight: 28,
                  }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    placeholder="cc"
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-body)",
                      fontSize: "0.72rem",
                      padding: "5px 8px",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      outline: "none",
                      minHeight: 28,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="bcc"
                    value={emailBcc}
                    onChange={(e) => setEmailBcc(e.target.value)}
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-body)",
                      fontSize: "0.72rem",
                      padding: "5px 8px",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      outline: "none",
                      minHeight: 28,
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={handleOpenInMail}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "var(--accent)",
                      color: "#fff",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      minHeight: 28,
                    }}
                  >
                    Open in Mail
                  </button>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-body)",
                      fontStyle: "italic",
                    }}
                  >
                    Creates a draft in your default mail app
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          borderTop: "1px solid var(--border-light)",
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {onComplete && (
            <button
              onClick={() => onComplete(task.id)}
              style={{
                fontSize: "0.68rem",
                color: "var(--low-text)",
                fontFamily: "var(--font-body)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
                letterSpacing: "0.02em",
              }}
            >
              complete
            </button>
          )}
          <button
            onClick={handleGenerateEmail}
            disabled={emailLoading}
            style={{
              fontSize: "0.68rem",
              color: emailLoading ? "var(--text-tertiary)" : "var(--ai-text)",
              fontFamily: "var(--font-body)",
              background: "none",
              border: "none",
              cursor: emailLoading ? "not-allowed" : "pointer",
              padding: "4px 0",
              letterSpacing: "0.02em",
            }}
          >
            {emailDraft ? "redraft email" : "draft email"}
          </button>

          {/* ClickUp button */}
          <div ref={clickupRef} style={{ position: "relative" }}>
            {task.clickupTaskId ? (
              <a
                href={task.clickupUrl || `https://app.clickup.com/t/${task.clickupTaskId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.68rem",
                  color: "var(--low-text)",
                  fontFamily: "var(--font-body)",
                  padding: "4px 0",
                  letterSpacing: "0.02em",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                &#10003; {task.clickupListName || "ClickUp"}
              </a>
            ) : (
              <button
                onClick={() => setClickupDropdownOpen(!clickupDropdownOpen)}
                disabled={clickupSending}
                style={{
                  fontSize: "0.68rem",
                  color: clickupSending ? "var(--text-tertiary)" : "var(--michael-text)",
                  fontFamily: "var(--font-body)",
                  background: "none",
                  border: "none",
                  cursor: clickupSending ? "not-allowed" : "pointer",
                  padding: "4px 0",
                  letterSpacing: "0.02em",
                }}
              >
                {clickupSending ? "sending..." : "clickup"}
              </button>
            )}

            {/* Dropdown */}
            {clickupDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: 4,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  zIndex: 10,
                  overflow: "hidden",
                  minWidth: 120,
                }}
              >
                {CLICKUP_LISTS.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleSendToClickUp(list.id, list.name)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "7px 12px",
                      fontSize: "0.68rem",
                      fontFamily: "var(--font-body)",
                      color: "var(--text-primary)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--border-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ClickUp error toast */}
        {clickupError && (
          <span
            style={{
              fontSize: "0.62rem",
              color: "var(--high-text)",
              fontFamily: "var(--font-body)",
            }}
          >
            {clickupError}
          </span>
        )}

        <button
          onClick={() => {
            if (confirm(`Delete "${task.taskName}"?`)) {
              onDelete(task.id);
            }
          }}
          style={{
            fontSize: "0.68rem",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-body)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
            letterSpacing: "0.02em",
          }}
        >
          delete
        </button>
      </div>
    </div>
  );
}

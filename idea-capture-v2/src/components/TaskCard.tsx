"use client";

import { CSSProperties } from "react";
import { Task, EnergyLevel, Destination } from "@/lib/types";

const ENERGY_LEVELS: EnergyLevel[] = ["low", "medium", "high"];
const DESTINATIONS: Destination[] = ["Ann", "AI", "Michael", "Later"];

interface TaskCardProps {
  task: Task;
  onUpdate: (updated: Task) => void;
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
  } as CSSProperties,

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "14px 18px 10px",
    gap: 8,
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
    minWidth: 200,
  } as CSSProperties,

  metaRow: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
    alignItems: "center",
  } as CSSProperties,

  cardBody: {
    padding: "0 18px 14px",
  } as CSSProperties,

  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  } as CSSProperties,

  fieldRow: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  } as CSSProperties,

  fieldLabel: {
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-tertiary)",
    fontWeight: 500,
    fontFamily: "var(--font-body)",
  } as CSSProperties,

  fieldInput: {
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    border: "none",
    borderBottom: "1px solid transparent",
    background: "transparent",
    padding: "1px 0",
    outline: "none",
    lineHeight: 1.5,
    color: "var(--text-primary)",
    width: "100%",
  } as CSSProperties,

  fieldSelect: {
    fontFamily: "var(--font-body)",
    fontSize: "0.72rem",
    padding: "5px 8px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    background: "var(--surface)",
    color: "var(--text-primary)",
    outline: "none",
    cursor: "pointer",
    minHeight: 34,
  } as CSSProperties,

  fieldTextarea: {
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
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
    padding: "10px 18px",
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

/* ── Level pill ── */

function levelStyle(level: string): CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    low: { bg: "var(--low-bg)", color: "var(--low-text)" },
    medium: { bg: "var(--medium-bg)", color: "var(--medium-text)" },
    high: { bg: "var(--high-bg)", color: "var(--high-text)" },
  };
  const c = map[level] || map.low;
  return {
    fontSize: "0.62rem",
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 20,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    background: c.bg,
    color: c.color,
    fontFamily: "var(--font-body)",
  };
}

/* ── Confidence pill ── */

function confidenceStyle(c: number): CSSProperties {
  let bg: string, color: string;
  if (c >= 0.85) {
    bg = "var(--low-bg)";
    color = "var(--low-text)";
  } else if (c >= 0.6) {
    bg = "var(--medium-bg)";
    color = "var(--medium-text)";
  } else {
    bg = "var(--high-bg)";
    color = "var(--high-text)";
  }
  return {
    fontSize: "0.62rem",
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 20,
    letterSpacing: "0.03em",
    background: bg,
    color: color,
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

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  function update(fields: Partial<Task>) {
    onUpdate({ ...task, ...fields });
  }

  const focusBorder = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderBottomColor = "var(--border)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderBottomColor = "transparent";
    },
  };

  return (
    <div style={styles.card}>
      {/* Top: title + meta badges */}
      <div style={styles.cardTop}>
        <input
          type="text"
          value={task.taskName}
          onChange={(e) => update({ taskName: e.target.value })}
          style={styles.cardTitle}
          {...focusBorder}
        />
        <div style={styles.metaRow}>
          <span style={destStyle(task.destination)}>{task.destination}</span>
          <span style={levelStyle(task.urgency)}>urg: {task.urgency}</span>
          <span style={levelStyle(task.importance)}>imp: {task.importance}</span>
          <span style={confidenceStyle(task.confidence)}>
            {Math.round(task.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Body: structured fields */}
      <div style={styles.cardBody}>
        <div style={styles.fieldGrid}>
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

          <Field label="Duration">
            <input
              type="text"
              value={task.duration}
              onChange={(e) => update({ duration: e.target.value })}
              style={styles.fieldInput}
              {...focusBorder}
            />
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

          <Field label="Confidence">
            <input
              type="text"
              value={`${Math.round(task.confidence * 100)}%`}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace("%", ""), 10);
                if (!isNaN(n))
                  update({ confidence: Math.min(1, Math.max(0, n / 100)) });
              }}
              style={styles.fieldInput}
              {...focusBorder}
            />
          </Field>
        </div>
      </div>

      {/* Footer: why + how */}
      <div style={styles.cardFooter}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Field label="Why Routed Here" fullWidth>
            <textarea
              value={task.whyRouted}
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
              value={task.how}
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
      </div>
    </div>
  );
}

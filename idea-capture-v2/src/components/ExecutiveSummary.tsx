"use client";

import { CSSProperties } from "react";
import { Task, Destination } from "@/lib/types";
import { calcScore, scoreColor } from "@/lib/score";

interface ExecutiveSummaryProps {
  tasks: Task[];
}

const SUMMARY_DESTS: { dest: Destination; label: string; color: string; bg: string }[] = [
  { dest: "Michael", label: "Michael", color: "var(--michael-text)", bg: "var(--michael-bg)" },
  { dest: "Ann", label: "Ann", color: "var(--ann-text)", bg: "var(--ann-bg)" },
  { dest: "AI", label: "AI", color: "var(--ai-text)", bg: "var(--ai-bg)" },
];

function getTopTasks(tasks: Task[], dest: Destination, n: number): Task[] {
  return tasks
    .filter((t) => t.destination === dest)
    .sort((a, b) => calcScore(b) - calcScore(a))
    .slice(0, n);
}

export default function ExecutiveSummary({ tasks }: ExecutiveSummaryProps) {
  if (tasks.length === 0) return null;

  const pillStyle = (color: string, bg: string): CSSProperties => ({
    fontSize: "0.62rem",
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 500,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    background: bg,
    color: color,
    fontFamily: "var(--font-body)",
  });

  const scoreStyle = (score: number): CSSProperties => {
    const sc = scoreColor(score);
    return {
      fontSize: "0.6rem",
      fontWeight: 600,
      padding: "1px 6px",
      borderRadius: 20,
      background: sc.bg,
      color: sc.color,
      fontFamily: "var(--font-body)",
      minWidth: 22,
      textAlign: "center",
    };
  };

  return (
    <section style={{ marginBottom: 28 }}>
      <div className="section-label">Top Priorities</div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          boxShadow: "var(--shadow)",
          padding: "14px 14px",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {SUMMARY_DESTS.map(({ dest, label, color, bg }) => {
          const top = getTopTasks(tasks, dest, 3);
          if (top.length === 0) return null;

          return (
            <div key={dest} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {label}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {top.map((task, i) => {
                  const score = calcScore(task);
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        const el = document.querySelector(`[data-task-id="${task.id}"]`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        paddingLeft: 4,
                        minWidth: 0,
                        overflow: "hidden",
                        cursor: "pointer",
                        borderRadius: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-tertiary)",
                          fontFamily: "var(--font-body)",
                          width: 14,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}.
                      </span>
                      <span style={scoreStyle(score)}>{score}</span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-body)",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.taskName}
                      </span>
                      <span
                        className="hide-mobile"
                        style={{
                          fontSize: "0.62rem",
                          color: "var(--text-tertiary)",
                          fontFamily: "var(--font-body)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {task.duration}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* Remove trailing margin from last group */}
        <style>{`.exec-summary > div:last-child { margin-bottom: 0; }`}</style>
      </div>
    </section>
  );
}

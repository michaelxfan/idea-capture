"use client";

import { useState, CSSProperties } from "react";
import { Task, Destination } from "@/lib/types";
import TaskCard from "./TaskCard";

const DEST_META: Record<
  Destination,
  { subtitle: string; color: string; bg: string }
> = {
  Michael: {
    subtitle: "Decision / judgment required",
    color: "var(--michael-text)",
    bg: "var(--michael-bg)",
  },
  Ann: {
    subtitle: "Research / admin / coordination",
    color: "var(--ann-text)",
    bg: "var(--ann-bg)",
  },
  AI: {
    subtitle: "Writing / ideation / content",
    color: "var(--ai-text)",
    bg: "var(--ai-bg)",
  },
  Later: {
    subtitle: "Non-urgent / not actionable",
    color: "var(--later-text)",
    bg: "var(--later-bg)",
  },
};

interface DestinationSectionProps {
  destination: Destination;
  tasks: Task[];
  onUpdateTask: (updated: Task) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onDuplicateTask?: (task: Task) => void;
}

export default function DestinationSection({
  destination,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onDuplicateTask,
}: DestinationSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = DEST_META[destination];

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    userSelect: "none",
    padding: "8px 0",
    marginBottom: collapsed ? 0 : 8,
    overflow: "hidden",
    minWidth: 0,
  };

  const arrowStyle: CSSProperties = {
    fontSize: "0.55rem",
    transition: "transform 0.2s",
    transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
    color: "var(--text-tertiary)",
  };

  const pillStyle: CSSProperties = {
    fontSize: "0.65rem",
    padding: "3px 9px",
    borderRadius: 20,
    fontWeight: 500,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    background: meta.bg,
    color: meta.color,
    fontFamily: "var(--font-body)",
  };

  const countStyle: CSSProperties = {
    fontSize: "0.65rem",
    color: "var(--text-tertiary)",
    fontFamily: "var(--font-body)",
  };

  const subtitleStyle: CSSProperties = {
    fontSize: "0.68rem",
    color: "var(--text-tertiary)",
    fontFamily: "var(--font-body)",
    fontWeight: 400,
    letterSpacing: "0.02em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  };

  const containerStyle: CSSProperties = {
    overflow: "hidden",
    transition: collapsed ? "max-height 0.3s ease, opacity 0.2s ease" : "none",
    maxHeight: collapsed ? 0 : "none",
    opacity: collapsed ? 0 : 1,
  };

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header toggle */}
      <div onClick={() => setCollapsed(!collapsed)} style={headerStyle}>
        <span style={arrowStyle}>&#9660;</span>
        <span style={pillStyle}>{destination}</span>
        <span style={subtitleStyle}>{meta.subtitle}</span>
        <span style={{ flex: 1 }} />
        <span style={countStyle}>
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Collapsible content */}
      <div style={containerStyle}>
        {tasks.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                onComplete={onCompleteTask}
                onDuplicate={onDuplicateTask}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "12px 0",
              fontSize: "0.72rem",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
            }}
          >
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

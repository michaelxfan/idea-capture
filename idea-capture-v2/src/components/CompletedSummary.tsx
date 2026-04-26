"use client";

import { Task, Destination } from "@/lib/types";

interface Props {
  tasks: Task[];
}

const DEST_ORDER: Destination[] = ["Michael", "Ann", "AI", "Later"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Returns the Monday of the ISO week containing `d` */
function weekStart(d: Date) {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift so Mon=0
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return startOfDay(mon);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtWeek(mon: Date) {
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `${fmtDate(mon)} – ${fmtDate(sun)}`;
}

export default function CompletedSummary({ tasks }: Props) {
  if (tasks.length === 0) return null;

  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // ── By Day ──────────────────────────────────────────────────────────────
  type DayBucket = { label: string; count: number };
  const dayMap = new Map<string, DayBucket>();

  for (const t of tasks) {
    const raw = t.completedAt ?? t.createdAt;
    const d = startOfDay(new Date(raw));
    const key = d.toISOString();

    if (!dayMap.has(key)) {
      let label: string;
      if (d.getTime() === today.getTime()) label = "Today";
      else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
      else label = fmtDate(d);
      dayMap.set(key, { label, count: 0 });
    }
    dayMap.get(key)!.count++;
  }

  const dayBuckets = Array.from(dayMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);

  // ── By Week ──────────────────────────────────────────────────────────────
  type WeekBucket = { label: string; isCurrentWeek: boolean; count: number };
  const weekMap = new Map<string, WeekBucket>();
  const thisWeekStart = weekStart(now);

  for (const t of tasks) {
    const raw = t.completedAt ?? t.createdAt;
    const d = new Date(raw);
    const ws = weekStart(d);
    const key = ws.toISOString();

    if (!weekMap.has(key)) {
      const isCurrentWeek = ws.getTime() === thisWeekStart.getTime();
      const label = isCurrentWeek ? "This week" : fmtWeek(ws);
      weekMap.set(key, { label, isCurrentWeek, count: 0 });
    }
    weekMap.get(key)!.count++;
  }

  const weekBuckets = Array.from(weekMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);

  // ── By Destination ───────────────────────────────────────────────────────
  const destCounts: Record<string, number> = {};
  for (const t of tasks) {
    destCounts[t.destination] = (destCounts[t.destination] ?? 0) + 1;
  }

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "14px 16px",
        background: "var(--surface)",
        border: "1px solid var(--border-light)",
        borderRadius: 8,
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Completion Summary
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
        }}
      >
        {/* By Day */}
        <div>
          <div style={colHeadStyle}>By Day</div>
          {dayBuckets.map((b) => (
            <Row key={b.label} label={b.label} count={b.count} />
          ))}
        </div>

        {/* By Week */}
        <div>
          <div style={colHeadStyle}>By Week</div>
          {weekBuckets.map((b) => (
            <Row key={b.label} label={b.label} count={b.count} bold={b.isCurrentWeek} />
          ))}
        </div>

        {/* By Destination */}
        <div>
          <div style={colHeadStyle}>By Person</div>
          {DEST_ORDER.filter((d) => destCounts[d]).map((d) => (
            <Row key={d} label={d} count={destCounts[d]} />
          ))}
        </div>
      </div>
    </div>
  );
}

const colHeadStyle: React.CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 600,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 6,
};

function Row({
  label,
  count,
  bold = false,
}: {
  label: string;
  count: number;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 6,
        marginBottom: 3,
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          color: bold ? "var(--text-primary)" : "var(--text-secondary)",
          fontFamily: "var(--font-body)",
          fontWeight: bold ? 600 : 400,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          fontWeight: bold ? 600 : 500,
          flexShrink: 0,
        }}
      >
        {count}
      </span>
    </div>
  );
}

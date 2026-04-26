import type { RelationshipStrength } from "@/lib/types";
import { relationshipChipClass, relationshipLabel } from "@/lib/score";

export function RelationshipChip({ r }: { r: RelationshipStrength }) {
  return <span className={`chip ${relationshipChipClass(r)}`}>{relationshipLabel(r)}</span>;
}

export function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span className="inline-flex items-center" title={`${score}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`score-dot ${i < score ? "on" : ""}`} />
      ))}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: number }) {
  const label = priority >= 4 ? "High priority" : priority === 3 ? "Medium" : "Low";
  const cls = priority >= 4 ? "chip-danger" : priority === 3 ? "chip-warn" : "chip";
  return <span className={`chip ${cls}`}>{label}</span>;
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "chip",
    in_progress: "chip-warn",
    blocked: "chip-danger",
    won: "chip-ok",
    lost: "chip",
    parked: "chip",
  };
  const label = status.replace("_", " ");
  return <span className={`chip ${map[status] ?? "chip"}`}>{label}</span>;
}

export function OfficeBadge({ on }: { on: boolean }) {
  return on ? <span className="chip chip-brand">In office</span> : <span className="chip">Remote</span>;
}

import type { Capture } from "@/types";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";

const MODE_COLOR: Record<string, string> = {
  Advance: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Stabilize: "bg-amber-50 text-amber-800 border-amber-200",
  Recover: "bg-sky-50 text-sky-800 border-sky-200",
  Escape: "bg-red-50 text-red-800 border-red-200",
};

export default function SplitSummaryCard({ capture }: { capture: Capture }) {
  const mc = capture.mode_classification;
  return (
    <Link href={`/review#${capture.id}`} className="card card-hover block p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-500">
          {capture.domain || "uncategorized"} · {formatRelative(capture.created_at)}
        </span>
        <div className="flex items-center gap-1.5">
          {capture.threshold_triggered && (
            <span className="text-[10px] text-ink-500">◉ triggered</span>
          )}
          {mc && (
            <span
              className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 ${MODE_COLOR[mc]}`}
            >
              {mc}
            </span>
          )}
        </div>
      </div>
      <p className="text-ink-900 text-sm leading-snug line-clamp-2 mb-4">
        {capture.situation_text}
      </p>
      {capture.a_intention && (
        <div className="space-y-1.5 text-xs">
          <div className="flex gap-2">
            <span className="text-emerald-700 font-semibold w-4">A</span>
            <span className="text-ink-700 line-clamp-1">{capture.a_intention}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-700 font-semibold w-4">B</span>
            <span className="text-ink-700 line-clamp-1">{capture.b_intention}</span>
          </div>
        </div>
      )}
    </Link>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const STATE_GROUPS = [
  {
    key: "time",
    chips: ["Morning", "Afternoon", "Evening"],
  },
  {
    key: "day",
    chips: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  {
    key: "location",
    chips: ["Toronto", "Vacation"],
  },
];

const ALL_CHIPS = STATE_GROUPS.flatMap((g) => g.chips.map((c) => c.toLowerCase()));

export function Filters({ tags }: { tags: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const activeTag = sp.get("tag") ?? "";

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      router.replace(`/?${params.toString()}`);
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setTag(t: string) {
    const params = new URLSearchParams(sp.toString());
    if (t && t !== activeTag) params.set("tag", t);
    else params.delete("tag");
    router.replace(`/?${params.toString()}`);
  }

  // Tags that exist on principles but aren't predefined state chips
  const extraTags = tags.filter((t) => !ALL_CHIPS.includes(t.toLowerCase()));

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        className="w-full bg-transparent border-b border-line focus:border-ink outline-none py-2 text-base placeholder:text-muted/60"
      />

      {/* State chips — horizontal scroll, no wrap */}
      <div className="-mx-5 sm:-mx-8">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none px-5 sm:px-8">
          {/* All */}
          <Chip
            label="All"
            active={activeTag === ""}
            onClick={() => setTag("")}
          />

          {STATE_GROUPS.map((group, gi) => (
            <span key={group.key} className="flex items-center gap-0">
              <span className="mx-3 text-line select-none text-sm">|</span>
              {group.chips.map((chip) => {
                const val = chip.toLowerCase();
                return (
                  <Chip
                    key={chip}
                    label={chip}
                    active={activeTag === val}
                    onClick={() => setTag(val)}
                  />
                );
              })}
            </span>
          ))}

          {/* Extra free-form tags (topic tags like stoicism, focus) */}
          {extraTags.length > 0 && (
            <span className="flex items-center gap-0">
              <span className="mx-3 text-line select-none text-sm">|</span>
              {extraTags.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={activeTag === t}
                  onClick={() => setTag(t)}
                />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-[11px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
        active
          ? "bg-ink text-cream"
          : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

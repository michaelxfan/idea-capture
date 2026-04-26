"use client";

import { useState } from "react";

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="h-section">{title}</span>
        <span className="text-ink-400 text-lg leading-none select-none">
          {open ? "–" : "+"}
        </span>
      </button>
      {open && <div className="border-t border-ink-100 p-5">{children}</div>}
    </div>
  );
}

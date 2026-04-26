"use client";

import { useState } from "react";

export default function TodayCopyButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="h-9 px-4 bg-ink text-surface rounded-full text-sm font-medium transition-all"
    >
      {copied ? "Copied ✓" : "Copy Message"}
    </button>
  );
}

"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-6 py-3 text-sm uppercase tracking-[0.2em] transition-all duration-200 ${
        pending
          ? "bg-muted text-cream cursor-not-allowed"
          : "bg-ink text-cream"
      }`}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

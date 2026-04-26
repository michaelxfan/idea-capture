"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <button
        className="btn btn-primary"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setMsg(null);
          try {
            const res = await fetch("/api/seed", { method: "POST" });
            const data = await res.json();
            setMsg(`Seeded ${data.created} stakeholders.`);
            router.refresh();
          } catch {
            setMsg("Seed failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Seeding…" : "Seed example stakeholders"}
      </button>
      {msg ? <span className="ml-3 text-sm text-[var(--text-secondary)]">{msg}</span> : null}
    </div>
  );
}

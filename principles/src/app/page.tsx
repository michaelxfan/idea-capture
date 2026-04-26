import Link from "next/link";
import { supabase, type Principle } from "@/lib/supabase";
import { Filters } from "@/components/Filters";
import { movePrinciple } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string };
}) {
  const { data } = await supabase
    .from("principles")
    .select("*")
    .order("priority", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const all = (data ?? []) as Principle[];
  const tagSet = new Set<string>();
  all.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
  const tags = Array.from(tagSet).sort();

  const q = (searchParams.q ?? "").toLowerCase();
  const tag = searchParams.tag ?? "";
  const filtered = all.filter((p) => {
    if (tag && !(p.tags ?? []).includes(tag)) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      (p.mantra ?? "").toLowerCase().includes(q) ||
      (p.meaning ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <main className="space-y-12">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <h1 className="font-serif text-5xl sm:text-6xl tracking-tight">Principles</h1>
          <p className="text-muted italic font-serif text-lg">
            The ideas I choose to live by.
          </p>
        </div>
        <Link
          href="/principles/new"
          className="shrink-0 mt-2 border border-ink text-ink px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] hover:bg-ink hover:text-cream transition-colors"
        >
          Add
        </Link>
      </header>

      <Filters tags={tags} />

      <section>
        {filtered.length === 0 ? (
          <p className="text-muted text-sm py-12 text-center">
            No principles yet. Begin with one.
          </p>
        ) : (
          <ol className="divide-y divide-line border-y border-line">
            {filtered.map((p, i) => (
              <li key={p.id} className="group">
                <div className="flex items-start gap-4 sm:gap-6 py-5">
                  <div className="font-serif text-xl text-muted w-7 shrink-0 pt-1 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <Link href={`/principles/${p.id}`} className="flex-1 min-w-0">
                    <h2 className="font-serif text-2xl sm:text-3xl leading-tight">
                      {p.title}
                    </h2>
                    {p.mantra && (
                      <p className="mt-1 italic font-serif text-muted text-base">
                        {p.mantra}
                      </p>
                    )}
                    {p.tags && p.tags.length > 0 && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                        {p.tags.join(" · ")}
                      </p>
                    )}
                  </Link>
                  <div className="flex flex-col items-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <form action={movePrinciple.bind(null, p.id, "up")}>
                      <button className="text-xs text-muted hover:text-ink px-1" aria-label="Up">
                        ↑
                      </button>
                    </form>
                    <form action={movePrinciple.bind(null, p.id, "down")}>
                      <button className="text-xs text-muted hover:text-ink px-1" aria-label="Down">
                        ↓
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, type Principle } from "@/lib/supabase";
import { deletePrinciple } from "@/app/actions";

export const dynamic = "force-dynamic";

const Section = ({ label, value }: { label: string; value: string | null }) =>
  value ? (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-[0.2em] text-muted">{label}</h3>
      <p className="text-lg leading-relaxed whitespace-pre-wrap">{value}</p>
    </section>
  ) : null;

export default async function PrincipleDetail({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from("principles")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!data) notFound();
  const p = data as Principle;

  return (
    <main className="space-y-12">
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-ink">
        ← Principles
      </Link>

      <header className="space-y-4">
        <h1 className="font-serif text-5xl sm:text-6xl tracking-tight leading-[1.05]">
          {p.title}
        </h1>
        {p.mantra && (
          <p className="font-serif italic text-2xl sm:text-3xl text-ink/80">
            “{p.mantra}”
          </p>
        )}
        {p.tags && p.tags.length > 0 && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
            {p.tags.join(" · ")}
          </p>
        )}
      </header>

      <div className="space-y-10">
        <Section label="Meaning" value={p.meaning} />
        <Section label="When I need this" value={p.when_needed} />
        <Section label="Counterbalance" value={p.counterbalance} />
        <Section label="Inspiration sources" value={p.inspiration_sources} />
        <Section label="Quotes" value={p.quotes} />
        <Section label="Notes" value={p.notes} />
      </div>

      <footer className="pt-8 border-t border-line space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Last updated{" "}
          {new Date(p.updated_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="flex items-center gap-6">
          <Link
            href={`/principles/${p.id}/edit`}
            className="bg-ink text-cream px-6 py-3 text-sm uppercase tracking-[0.2em]"
          >
            Edit
          </Link>
          <form action={deletePrinciple.bind(null, p.id)}>
            <button className="text-sm text-muted hover:text-ink underline underline-offset-4">
              Delete
            </button>
          </form>
        </div>
      </footer>
    </main>
  );
}

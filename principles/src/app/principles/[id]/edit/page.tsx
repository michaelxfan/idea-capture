import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, type Principle } from "@/lib/supabase";
import { PrincipleForm } from "@/components/PrincipleForm";
import { updatePrinciple } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from("principles")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!data) notFound();
  const p = data as Principle;

  const action = updatePrinciple.bind(null, p.id);
  return (
    <main className="space-y-10">
      <Link
        href={`/principles/${p.id}`}
        className="text-xs uppercase tracking-[0.2em] text-muted hover:text-ink"
      >
        ← Back
      </Link>
      <h1 className="font-serif text-4xl">Edit Principle</h1>
      <PrincipleForm
        action={action}
        principle={p}
        submitLabel="Save"
        cancelHref={`/principles/${p.id}`}
      />
    </main>
  );
}

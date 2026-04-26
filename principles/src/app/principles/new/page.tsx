import Link from "next/link";
import { PrincipleForm } from "@/components/PrincipleForm";
import { createPrinciple } from "@/app/actions";

export default function NewPrinciplePage() {
  return (
    <main className="space-y-10">
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-ink">
        ← Principles
      </Link>
      <h1 className="font-serif text-4xl">New Principle</h1>
      <PrincipleForm action={createPrinciple} submitLabel="Save" cancelHref="/" />
    </main>
  );
}

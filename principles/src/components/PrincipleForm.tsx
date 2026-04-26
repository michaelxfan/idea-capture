import Link from "next/link";
import type { Principle } from "@/lib/supabase";
import { SubmitButton } from "./SubmitButton";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  principle?: Partial<Principle>;
  submitLabel: string;
  cancelHref: string;
};

const fieldClass =
  "w-full bg-transparent border-b border-line focus:border-ink outline-none py-2 text-base placeholder:text-muted/60";
const areaClass =
  "w-full bg-transparent border border-line focus:border-ink outline-none p-3 text-base rounded-none placeholder:text-muted/60";
const labelClass = "block text-xs uppercase tracking-[0.18em] text-muted mb-2";

export function PrincipleForm({ action, principle, submitLabel, cancelHref }: Props) {
  const p = principle ?? {};
  return (
    <form action={action} className="space-y-8">
      <div className="flex items-center gap-6">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className="text-sm text-muted hover:text-ink">
          Cancel
        </Link>
      </div>

      <div>
        <label className={labelClass}>Title</label>
        <input
          name="title"
          required
          defaultValue={p.title ?? ""}
          className={fieldClass + " font-serif text-2xl"}
          placeholder="Presence of Mind"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Priority</label>
          <input
            name="priority"
            type="number"
            min={1}
            defaultValue={p.priority ?? ""}
            className={fieldClass}
            placeholder="1"
          />
        </div>
        <div>
          <label className={labelClass}>Tags (comma)</label>
          <input
            name="tags"
            defaultValue={(p.tags ?? []).join(", ")}
            className={fieldClass}
            placeholder="stoicism, focus"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Mantra</label>
        <input
          name="mantra"
          defaultValue={p.mantra ?? ""}
          className={fieldClass + " font-serif italic text-lg"}
          placeholder="Pause. Then choose."
        />
      </div>

      {[
        ["meaning", "Meaning"],
        ["when_needed", "When I need this"],
        ["counterbalance", "Counterbalance"],
        ["inspiration_sources", "Inspiration sources"],
        ["quotes", "Quotes"],
        ["notes", "Notes"],
      ].map(([name, label]) => (
        <div key={name}>
          <label className={labelClass}>{label}</label>
          <textarea
            name={name}
            rows={3}
            defaultValue={(p as any)[name] ?? ""}
            className={areaClass}
          />
        </div>
      ))}

    </form>
  );
}

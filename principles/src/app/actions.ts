"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

function parseTags(raw: FormDataEntryValue | null): string[] | null {
  if (!raw) return null;
  const arr = String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

function val(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function createPrinciple(formData: FormData) {
  const title = val(formData, "title");
  if (!title) throw new Error("Title required");

  const priorityRaw = val(formData, "priority");
  const payload = {
    title,
    mantra: val(formData, "mantra"),
    meaning: val(formData, "meaning"),
    when_needed: val(formData, "when_needed"),
    counterbalance: val(formData, "counterbalance"),
    inspiration_sources: val(formData, "inspiration_sources"),
    quotes: val(formData, "quotes"),
    notes: val(formData, "notes"),
    tags: parseTags(formData.get("tags")),
    priority: priorityRaw ? Number(priorityRaw) : null,
  };

  const { data, error } = await supabase
    .from("principles")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect(`/principles/${data.id}`);
}

export async function updatePrinciple(id: string, formData: FormData) {
  const title = val(formData, "title");
  if (!title) throw new Error("Title required");

  const priorityRaw = val(formData, "priority");
  const payload = {
    title,
    mantra: val(formData, "mantra"),
    meaning: val(formData, "meaning"),
    when_needed: val(formData, "when_needed"),
    counterbalance: val(formData, "counterbalance"),
    inspiration_sources: val(formData, "inspiration_sources"),
    quotes: val(formData, "quotes"),
    notes: val(formData, "notes"),
    tags: parseTags(formData.get("tags")),
    priority: priorityRaw ? Number(priorityRaw) : null,
  };

  const { error } = await supabase.from("principles").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/principles/${id}`);
  redirect(`/principles/${id}`);
}

export async function deletePrinciple(id: string) {
  const { error } = await supabase.from("principles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function movePrinciple(id: string, direction: "up" | "down") {
  const { data: all } = await supabase
    .from("principles")
    .select("id, priority")
    .order("priority", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (!all) return;

  const ordered = all.map((r, i) => ({ id: r.id, priority: i + 1 }));
  const idx = ordered.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= ordered.length) {
    // still normalize priorities
    for (const r of ordered) {
      await supabase.from("principles").update({ priority: r.priority }).eq("id", r.id);
    }
    revalidatePath("/");
    return;
  }
  [ordered[idx].priority, ordered[swap].priority] = [ordered[swap].priority, ordered[idx].priority];
  for (const r of ordered) {
    await supabase.from("principles").update({ priority: r.priority }).eq("id", r.id);
  }
  revalidatePath("/");
}

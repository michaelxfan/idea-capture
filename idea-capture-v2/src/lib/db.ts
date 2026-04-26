import { createClient } from "@supabase/supabase-js";
import { Task, EmailContext } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/* ── snake_case DB ↔ camelCase Task mapping ── */

interface DbRow {
  id: string;
  raw_input: string;
  task_name: string;
  activation_energy: string;
  duration: string;
  urgency: string;
  importance: string;
  why_routed: string;
  how: string;
  destination: string;
  confidence: number;
  created_at: string;
  due_date: string | null;
  completed: boolean;
  clickup_task_id: string | null;
  clickup_list_name: string | null;
  clickup_url: string | null;
  image_url: string | null;
  email_context: EmailContext | null;
  steps: string[] | null;
  completed_at: string | null;
}

function rowToTask(row: DbRow): Task {
  return {
    id: row.id,
    rawInput: row.raw_input,
    taskName: row.task_name,
    activationEnergy: row.activation_energy as Task["activationEnergy"],
    duration: row.duration,
    urgency: row.urgency as Task["urgency"],
    importance: row.importance as Task["importance"],
    whyRouted: row.why_routed || undefined,
    how: row.how || undefined,
    destination: row.destination as Task["destination"],
    confidence: row.confidence,
    createdAt: row.created_at,
    dueDate: row.due_date ?? undefined,
    completed: row.completed,
    clickupTaskId: row.clickup_task_id ?? undefined,
    clickupListName: row.clickup_list_name ?? undefined,
    clickupUrl: row.clickup_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    emailContext: row.email_context ?? undefined,
    steps: row.steps ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

function taskToRow(task: Task): DbRow {
  return {
    id: task.id,
    raw_input: task.rawInput,
    task_name: task.taskName,
    activation_energy: task.activationEnergy,
    duration: task.duration,
    urgency: task.urgency,
    importance: task.importance,
    why_routed: task.whyRouted ?? "",
    how: task.how ?? "",
    destination: task.destination,
    confidence: task.confidence,
    created_at: task.createdAt,
    due_date: task.dueDate ?? null,
    completed: task.completed ?? false,
    clickup_task_id: task.clickupTaskId ?? null,
    clickup_list_name: task.clickupListName ?? null,
    clickup_url: task.clickupUrl ?? null,
    image_url: task.imageUrl ?? null,
    email_context: task.emailContext ?? null,
    steps: task.steps ?? null,
    completed_at: task.completedAt ?? null,
  };
}

/* ── CRUD operations ── */

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export async function fetchTasks(): Promise<Task[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  return (data as DbRow[]).map(rowToTask);
}

export async function upsertTasks(tasks: Task[]): Promise<boolean> {
  if (!supabase || tasks.length === 0) return true;

  const rows = tasks.map(taskToRow);
  const { error } = await supabase.from("tasks").upsert(rows);

  if (error) {
    console.error("Supabase upsert error:", error);
    return false;
  }
  return true;
}

export async function updateTask(task: Task): Promise<boolean> {
  if (!supabase) return true;

  const row = taskToRow(task);
  // Use upsert (not update) so a new task gets inserted if it wasn't persisted yet
  const { error } = await supabase.from("tasks").upsert(row);

  if (error) {
    console.error("Supabase update error:", error);
    return false;
  }
  return true;
}

export async function deleteTask(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Supabase delete task error:", error);
  }
}

/**
 * Subscribe to realtime changes on the tasks table.
 * Returns an unsubscribe function. No-op if Supabase isn't configured.
 */
export function subscribeToTasks(handlers: {
  onInsert?: (task: Task) => void;
  onUpdate?: (task: Task) => void;
  onDelete?: (id: string) => void;
}): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("tasks-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tasks" },
      (payload) => handlers.onInsert?.(rowToTask(payload.new as DbRow))
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "tasks" },
      (payload) => handlers.onUpdate?.(rowToTask(payload.new as DbRow))
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "tasks" },
      (payload) => {
        const id = (payload.old as { id?: string })?.id;
        if (id) handlers.onDelete?.(id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function deleteAllTasks(): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("tasks").delete().neq("id", "");

  if (error) {
    console.error("Supabase delete error:", error);
  }
}

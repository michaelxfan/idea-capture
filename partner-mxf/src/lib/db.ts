import type {
  DailyLog,
  PartnerProfile,
  RepairOutcome,
  AnalyzeConversation,
  AnalyzeMessage,
  AnalyzeOutcome,
  DriftLevel,
} from "./types";
import { MOCK_LOGS, MOCK_PROFILE, MOCK_OUTCOMES, MOCK_CONVERSATIONS } from "./mock-data";

let supabaseModule: typeof import("./supabase") | null = null;
async function getSupabase() {
  if (!supabaseModule) {
    try {
      supabaseModule = await import("./supabase");
    } catch {
      return null;
    }
  }
  return supabaseModule.supabase;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<PartnerProfile | null> {
  try {
    const db = await getSupabase();
    if (!db) return MOCK_PROFILE;
    const { data, error } = await db
      .from("partner_profiles")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? MOCK_PROFILE;
  } catch {
    return MOCK_PROFILE;
  }
}

export async function upsertProfile(
  profile: Omit<PartnerProfile, "id" | "created_at" | "updated_at">
): Promise<PartnerProfile | null> {
  try {
    const db = await getSupabase();
    if (!db) return null;
    const { data, error } = await db
      .from("partner_profiles")
      .upsert({ ...profile, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as PartnerProfile;
  } catch {
    return null;
  }
}

// ── Logs ─────────────────────────────────────────────────────────────────────

export async function fetchRecentLogs(limit = 14): Promise<DailyLog[]> {
  try {
    const db = await getSupabase();
    if (!db) return MOCK_LOGS.slice(0, limit);
    const { data, error } = await db
      .from("daily_relationship_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as DailyLog[];
  } catch {
    return [];
  }
}

export async function insertLog(
  log: Omit<DailyLog, "id" | "created_at">
): Promise<DailyLog | null> {
  try {
    const db = await getSupabase();
    if (!db) return null;
    const { data, error } = await db
      .from("daily_relationship_logs")
      .upsert({ ...log }, { onConflict: "log_date" })
      .select()
      .single();
    if (error) throw error;
    return data as DailyLog;
  } catch {
    return null;
  }
}

export async function deleteLog(id: string): Promise<boolean> {
  try {
    const db = await getSupabase();
    if (!db) return false;
    const { error } = await db
      .from("daily_relationship_logs")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// ── Outcomes ─────────────────────────────────────────────────────────────────

export async function fetchOutcomes(limit = 20): Promise<RepairOutcome[]> {
  try {
    const db = await getSupabase();
    if (!db) return MOCK_OUTCOMES;
    const { data, error } = await db
      .from("repair_outcomes")
      .select("*")
      .order("log_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as RepairOutcome[];
  } catch {
    return [];
  }
}

export async function insertOutcome(
  outcome: Omit<RepairOutcome, "id" | "created_at">
): Promise<RepairOutcome | null> {
  try {
    const db = await getSupabase();
    if (!db) return null;
    const { data, error } = await db
      .from("repair_outcomes")
      .insert(outcome)
      .select()
      .single();
    if (error) throw error;
    return data as RepairOutcome;
  } catch {
    return null;
  }
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function fetchConversations(limit = 20): Promise<AnalyzeConversation[]> {
  try {
    const db = await getSupabase();
    if (!db) return MOCK_CONVERSATIONS;
    const { data, error } = await db
      .from("analyze_conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AnalyzeConversation[];
  } catch {
    return [];
  }
}

export async function fetchConversation(id: string): Promise<AnalyzeConversation | null> {
  try {
    const db = await getSupabase();
    if (!db) {
      const mock = MOCK_CONVERSATIONS.find((c) => c.id === id);
      return mock ?? null;
    }
    const { data: conv, error: convErr } = await db
      .from("analyze_conversations")
      .select("*")
      .eq("id", id)
      .single();
    if (convErr) throw convErr;

    const { data: msgs, error: msgErr } = await db
      .from("analyze_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (msgErr) throw msgErr;

    return { ...conv, messages: msgs ?? [] } as AnalyzeConversation;
  } catch {
    return null;
  }
}

export async function createConversation(opts: {
  profile_id: string | null;
  summary: string;
  drift_level: DriftLevel;
  drift_score: number;
}): Promise<string | null> {
  try {
    const db = await getSupabase();
    if (!db) return "mock-conv-" + Date.now();
    const { data, error } = await db
      .from("analyze_conversations")
      .insert(opts)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch {
    return null;
  }
}

export async function appendMessage(msg: {
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
}): Promise<AnalyzeMessage | null> {
  try {
    const db = await getSupabase();
    if (!db) return null;
    const { data, error } = await db
      .from("analyze_messages")
      .insert(msg)
      .select()
      .single();
    if (error) throw error;
    return data as AnalyzeMessage;
  } catch {
    return null;
  }
}

export async function fetchRecentConversationSummaries(
  limit = 5
): Promise<{ summary: string; drift_level: DriftLevel; created_at: string }[]> {
  try {
    const db = await getSupabase();
    if (!db) return MOCK_CONVERSATIONS.map((c) => ({
      summary: c.summary ?? "",
      drift_level: c.drift_level ?? "solid",
      created_at: c.created_at,
    }));
    const { data, error } = await db
      .from("analyze_conversations")
      .select("summary, drift_level, created_at")
      .not("summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as { summary: string; drift_level: DriftLevel; created_at: string }[];
  } catch {
    return [];
  }
}

// ── Analyze Outcomes ──────────────────────────────────────────────────────────

export async function insertAnalyzeOutcome(
  outcome: Omit<AnalyzeOutcome, "id" | "created_at">
): Promise<AnalyzeOutcome | null> {
  try {
    const db = await getSupabase();
    if (!db) return null;
    const { data, error } = await db
      .from("analyze_outcomes")
      .insert(outcome)
      .select()
      .single();
    if (error) throw error;
    return data as AnalyzeOutcome;
  } catch {
    return null;
  }
}

export async function fetchAnalyzeOutcomes(limit = 20): Promise<AnalyzeOutcome[]> {
  try {
    const db = await getSupabase();
    if (!db) return [];
    const { data, error } = await db
      .from("analyze_outcomes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AnalyzeOutcome[];
  } catch {
    return [];
  }
}

export async function fetchOutcomePatterns(): Promise<{
  helped: AnalyzeOutcome[];
  madeWorse: AnalyzeOutcome[];
  total: number;
}> {
  const outcomes = await fetchAnalyzeOutcomes(50);
  return {
    helped: outcomes.filter((o) => o.outcome === "helped" && o.followed !== "no"),
    madeWorse: outcomes.filter((o) => o.outcome === "made-worse"),
    total: outcomes.length,
  };
}

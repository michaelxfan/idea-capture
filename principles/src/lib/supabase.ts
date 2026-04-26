import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

export type Principle = {
  id: string;
  title: string;
  mantra: string | null;
  meaning: string | null;
  when_needed: string | null;
  counterbalance: string | null;
  inspiration_sources: string | null;
  quotes: string | null;
  notes: string | null;
  tags: string[] | null;
  priority: number | null;
  created_at: string;
  updated_at: string;
};

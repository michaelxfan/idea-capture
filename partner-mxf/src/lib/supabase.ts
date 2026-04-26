import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const noCacheFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

function createServerClient() {
  if (!service) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, service, {
    auth: { persistSession: false },
    global: { fetch: noCacheFetch },
  });
}

export const supabase = createServerClient();

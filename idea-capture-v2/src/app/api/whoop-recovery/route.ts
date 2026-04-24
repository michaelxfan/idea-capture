import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 15;

const WHOOP_CLIENT_ID = process.env.WHOOP_CLIENT_ID ?? "";
const WHOOP_CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET ?? "";

interface WhoopTokenRow {
  id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  updated_at: string;
}

async function getAccessToken(): Promise<{
  token: string | null;
  connected: boolean;
}> {
  // Legacy: static env var
  if (process.env.WHOOP_ACCESS_TOKEN) {
    return { token: process.env.WHOOP_ACCESS_TOKEN, connected: true };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return { token: null, connected: false };

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("whoop_tokens")
    .select("*")
    .eq("id", "singleton")
    .single();

  if (error || !data) return { token: null, connected: false };
  const row = data as WhoopTokenRow;

  // Refresh if expiring within 5 minutes
  const needsRefresh =
    row.expires_at !== null &&
    Date.now() > row.expires_at - 5 * 60 * 1000 &&
    !!row.refresh_token;

  if (!needsRefresh) return { token: row.access_token, connected: true };

  try {
    const refreshRes = await fetch(
      "https://api.prod.whoop.com/oauth/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: row.refresh_token!,
          client_id: WHOOP_CLIENT_ID,
          client_secret: WHOOP_CLIENT_SECRET,
        }).toString(),
      }
    );

    if (!refreshRes.ok) {
      console.error("WHOOP refresh failed:", refreshRes.status);
      return { token: row.access_token, connected: true };
    }

    const newTokens = await refreshRes.json();
    await supabase.from("whoop_tokens").upsert({
      id: "singleton",
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token ?? row.refresh_token,
      expires_at: newTokens.expires_in
        ? Date.now() + newTokens.expires_in * 1000
        : null,
      updated_at: new Date().toISOString(),
    });

    return { token: newTokens.access_token as string, connected: true };
  } catch (err) {
    console.error("WHOOP refresh error:", err);
    return { token: row.access_token, connected: true };
  }
}

export async function GET() {
  const { token, connected } = await getAccessToken();

  if (!token) {
    return NextResponse.json({
      recoveryScore: null,
      hrv: null,
      restingHeartRate: null,
      source: "none",
      connected: false,
    });
  }

  try {
    const res = await fetch(
      "https://api.prod.whoop.com/developer/v2/recovery?limit=1&sort=desc",
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error("WHOOP API error:", res.status);
      return NextResponse.json({
        recoveryScore: null,
        hrv: null,
        restingHeartRate: null,
        source: "none",
        connected,
      });
    }

    const data = await res.json();
    const record = data?.records?.[0];
    const recoveryScore = record?.score?.recovery_score ?? null;
    const hrv = record?.score?.hrv_rmssd_milli
      ? Math.round(record.score.hrv_rmssd_milli)
      : null;
    const restingHeartRate = record?.score?.resting_heart_rate ?? null;

    return NextResponse.json({
      recoveryScore,
      hrv,
      restingHeartRate,
      source: "whoop",
      connected: true,
    });
  } catch (err) {
    console.error("WHOOP fetch error:", err instanceof Error ? err.message : err);
    return NextResponse.json({
      recoveryScore: null,
      hrv: null,
      restingHeartRate: null,
      source: "none",
      connected,
    });
  }
}

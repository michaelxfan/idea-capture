import { NextResponse } from "next/server";

export const maxDuration = 15;

/**
 * Fetch today's WHOOP recovery score.
 * Requires WHOOP_ACCESS_TOKEN env var (a valid bearer token from the WHOOP OAuth flow).
 * Returns { recoveryScore: number | null, hrv: number | null, source: "whoop" | "none" }
 */
export async function GET() {
  const token = process.env.WHOOP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ recoveryScore: null, hrv: null, source: "none" });
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
      return NextResponse.json({ recoveryScore: null, hrv: null, source: "none" });
    }

    const data = await res.json();
    const record = data?.records?.[0];
    const recoveryScore = record?.score?.recovery_score ?? null;
    const hrv = record?.score?.hrv_rmssd_milli ?? null;

    return NextResponse.json({ recoveryScore, hrv, source: "whoop" });
  } catch (err) {
    console.error("WHOOP fetch error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ recoveryScore: null, hrv: null, source: "none" });
  }
}

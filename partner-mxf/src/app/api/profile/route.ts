import { NextRequest, NextResponse } from "next/server";
import { fetchProfile, upsertProfile } from "@/lib/db";

export async function GET() {
  const profile = await fetchProfile();
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await upsertProfile({
      name: body.name ?? "",
      attachment_style: body.attachment_style ?? null,
      mbti: body.mbti ?? null,
      core_tension: body.core_tension ?? null,
      push_pull_tendency: body.push_pull_tendency ?? null,
      trust_curve: body.trust_curve ?? null,
      repair_style: body.repair_style ?? "time",
      repair_style_ranking: body.repair_style_ranking ?? [],
      comm_sensitivity: body.comm_sensitivity ?? "medium",
      comm_sensitivity_internal: body.comm_sensitivity_internal ?? null,
      comm_sensitivity_note: body.comm_sensitivity_note ?? null,
      gift_sensitivity: body.gift_sensitivity ?? "low",
      gift_sensitivity_note: body.gift_sensitivity_note ?? null,
      best_connection_format: body.best_connection_format ?? "dinner",
      best_connection_secondary: body.best_connection_secondary ?? null,
      best_connection_note: body.best_connection_note ?? null,
      trigger_profile: body.trigger_profile ?? [],
      stress_response: body.stress_response ?? [],
      reengagement_pattern: body.reengagement_pattern ?? null,
      trust_builders: body.trust_builders ?? [],
      trust_breakers: body.trust_breakers ?? [],
      notes: body.notes ?? null,
    });
    return NextResponse.json({ ok: true, profile: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

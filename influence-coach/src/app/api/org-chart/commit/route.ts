import { NextRequest, NextResponse } from "next/server";
import { upsertStakeholder } from "@/lib/db";
import type { ExtractedOrgPerson } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { people, uploadId } = (await req.json()) as {
    people: ExtractedOrgPerson[];
    uploadId?: string;
  };
  if (!Array.isArray(people)) return NextResponse.json({ error: "people[] required" }, { status: 400 });

  const created = [];
  for (const p of people) {
    if (!p.name?.trim()) continue;
    const s = await upsertStakeholder({
      name: p.name.trim(),
      title: p.title ?? "",
      team: p.team ?? "",
      managerName: p.managerName,
      orgChartImageRef: uploadId,
    });
    if (s) created.push(s);
  }
  return NextResponse.json({ created });
}

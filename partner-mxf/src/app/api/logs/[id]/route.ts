import { NextRequest, NextResponse } from "next/server";
import { deleteLog } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ok = await deleteLog(params.id);
  return NextResponse.json({ ok });
}

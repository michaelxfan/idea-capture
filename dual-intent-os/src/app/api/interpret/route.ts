import { NextResponse } from "next/server";
import { interpretCapture } from "@/lib/ai/provider";
import { captureInputSchema } from "@/lib/ai/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = captureInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const interpretation = await interpretCapture(parsed.data);
    return NextResponse.json({ interpretation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Interpretation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

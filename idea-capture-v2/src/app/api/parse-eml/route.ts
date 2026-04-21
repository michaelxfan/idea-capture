import { NextRequest, NextResponse } from "next/server";
import { simpleParser } from "mailparser";
import { EmailContext } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

function addrToString(addr: unknown): string | undefined {
  if (!addr) return undefined;
  if (typeof addr === "string") return addr;
  if (Array.isArray(addr)) {
    return addr
      .map((a) => (typeof a === "object" && a && "text" in a ? (a as { text: string }).text : ""))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof addr === "object" && addr && "text" in addr) {
    return (addr as { text: string }).text;
  }
  return undefined;
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|br|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".eml")) {
      return NextResponse.json(
        { error: "Only .eml files are supported" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await simpleParser(buffer);

    let body = parsed.text?.trim() || "";
    if (!body && parsed.html) {
      body = htmlToPlain(parsed.html);
    }
    // Truncate very long bodies to keep context manageable
    if (body.length > 8000) {
      body = body.slice(0, 8000) + "\n\n[...truncated]";
    }

    const context: EmailContext = {
      subject: parsed.subject || undefined,
      from: addrToString(parsed.from),
      to: addrToString(parsed.to),
      cc: addrToString(parsed.cc),
      date: parsed.date ? parsed.date.toISOString() : undefined,
      body: body || "(empty email body)",
      filename: file.name,
    };

    return NextResponse.json({ context });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse email";
    console.error("parse-eml error:", message);
    return NextResponse.json(
      { error: `Could not parse email: ${message}` },
      { status: 400 }
    );
  }
}

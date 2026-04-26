import { NextRequest, NextResponse } from "next/server";
import { callClaudeJson, hasAnthropicKey, type ClaudeImageMediaType } from "@/lib/anthropic";
import {
  ORG_CHART_EXTRACT_SCHEMA,
  ORG_CHART_EXTRACT_SYSTEM,
} from "@/lib/prompts";
import { createUpload } from "@/lib/db";
import type { ExtractedOrgPerson } from "@/lib/types";

const SUPPORTED: ClaudeImageMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
function toSupported(mime: string): ClaudeImageMediaType {
  return (SUPPORTED as string[]).includes(mime) ? (mime as ClaudeImageMediaType) : "image/png";
}

export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * Accepts: multipart form-data with field `image` (the uploaded org chart).
 * Returns: { people: ExtractedOrgPerson[], uploadId }.
 * Without an Anthropic key or on parse failure, returns an empty list so the user can add manually.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image file required" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const mediaType = toSupported(file.type || "image/png");
  const dataUrl = `data:${mediaType};base64,${buf.toString("base64")}`;

  // Persist the upload attempt (image stored as data URL in Postgres — fine for a starter).
  const upload = await createUpload({
    imageUrl: dataUrl,
    parsingStatus: hasAnthropicKey() ? "pending" : "manual",
  });

  if (!hasAnthropicKey()) {
    return NextResponse.json({
      people: [],
      uploadId: upload?.id,
      mock: true,
      message: "No Anthropic key configured — add stakeholders manually.",
    });
  }

  try {
    const data = await callClaudeJson<{ people: ExtractedOrgPerson[] }>({
      system: ORG_CHART_EXTRACT_SYSTEM,
      user: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: buf.toString("base64") },
        },
        { type: "text", text: ORG_CHART_EXTRACT_SCHEMA },
      ],
      maxTokens: 2000,
      temperature: 0.2,
    });
    return NextResponse.json({ people: data.people ?? [], uploadId: upload?.id, mock: false });
  } catch (err) {
    console.error("org-chart parse failed:", err);
    return NextResponse.json({
      people: [],
      uploadId: upload?.id,
      mock: true,
      error: "Parsing failed — add manually.",
    });
  }
}

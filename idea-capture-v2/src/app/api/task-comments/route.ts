import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

/**
 * Fetch the latest comment for a ClickUp task.
 * Body: { taskId: string }
 * Returns: { latestComment: string | null, author: string | null }
 */
export async function POST(req: NextRequest) {
  const { taskId } = await req.json();
  if (!taskId) {
    return NextResponse.json({ latestComment: null, author: null });
  }

  const apiToken = process.env.CLICKUP_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ latestComment: null, author: null });
  }

  try {
    const url = `https://api.clickup.com/api/v2/task/${taskId}/comment?order_by=date_created&reverse=true&limit=1`;
    const res = await fetch(url, {
      headers: { Authorization: apiToken },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ latestComment: null, author: null });
    }

    const data = await res.json();
    const comments: Array<{
      comment_text?: string;
      comment?: Array<{ text?: string }>;
      user?: { username?: string };
    }> = data.comments ?? [];

    if (comments.length === 0) {
      return NextResponse.json({ latestComment: null, author: null });
    }

    const latest = comments[0];
    // ClickUp comments can be plain text or rich content array
    let text: string | null = null;
    if (typeof latest.comment_text === "string" && latest.comment_text.trim()) {
      text = latest.comment_text.trim();
    } else if (Array.isArray(latest.comment)) {
      text = latest.comment.map((c) => c.text ?? "").join("").trim() || null;
    }

    const author = latest.user?.username ?? null;
    return NextResponse.json({ latestComment: text?.slice(0, 500) ?? null, author });
  } catch (err) {
    console.error("task-comments error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ latestComment: null, author: null });
  }
}

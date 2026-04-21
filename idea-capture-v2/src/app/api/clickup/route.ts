import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

const ASSIGNEE_MAP: Record<string, number> = {
  Michael: 94209984,
  Ann: 94438580,
};

export async function POST(req: NextRequest) {
  const { listId, taskName, description, imageUrl, destination } = await req.json();

  const apiToken = process.env.CLICKUP_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      { error: "ClickUp API token not configured" },
      { status: 500 }
    );
  }

  if (!listId || !taskName) {
    return NextResponse.json(
      { error: "listId and taskName are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task`,
      {
        method: "POST",
        headers: {
          Authorization: apiToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: taskName,
          description: description || "",
          ...(destination && ASSIGNEE_MAP[destination]
            ? { assignees: [ASSIGNEE_MAP[destination]] }
            : {}),
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("ClickUp API error:", res.status, errBody);
      return NextResponse.json(
        { error: `ClickUp error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Attach image if provided
    if (imageUrl && data.id) {
      try {
        // Download the image
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const imgBuffer = await imgRes.arrayBuffer();
          const contentType = imgRes.headers.get("content-type") || "image/png";
          const ext = contentType.split("/")[1] || "png";
          const filename = `attachment.${ext}`;

          // Build multipart form data manually
          const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
          const body = Buffer.concat([
            Buffer.from(
              `--${boundary}\r\nContent-Disposition: form-data; name="attachment"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
            ),
            Buffer.from(imgBuffer),
            Buffer.from(`\r\n--${boundary}--\r\n`),
          ]);

          await fetch(
            `https://api.clickup.com/api/v2/task/${data.id}/attachment`,
            {
              method: "POST",
              headers: {
                Authorization: apiToken,
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
              },
              body,
            }
          );
        }
      } catch (attachErr) {
        // Non-blocking: task was created, attachment just failed
        console.error("ClickUp attachment error:", attachErr);
      }
    }

    return NextResponse.json({
      taskId: data.id,
      url: data.url,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create ClickUp task";
    console.error("ClickUp error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

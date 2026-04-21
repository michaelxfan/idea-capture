import { NextRequest, NextResponse } from "next/server";
import { CLICKUP_LISTS } from "@/lib/clickup";
import { resolveAssigneeId, ASSIGNEES } from "@/lib/assignees";
import { normalizeClickUpTask, NormalizedTask } from "@/lib/recommend";

export const maxDuration = 30;

/**
 * Fetch open ClickUp tasks for a given assignee across all configured lists.
 * Falls back to a small mock set if no API token is configured.
 *
 * Body: { assignee: string, board?: string, mock?: boolean }
 * board: list name ("GH" | "Personal" | "Innovative") or omit/null for all lists
 */
export async function POST(req: NextRequest) {
  const { assignee, board, mock } = await req.json();

  if (!assignee) {
    return NextResponse.json({ error: "assignee is required" }, { status: 400 });
  }

  const assigneeId = resolveAssigneeId(assignee);
  if (!assigneeId) {
    return NextResponse.json(
      {
        error: `Unknown assignee "${assignee}". Add them to src/lib/assignees.ts`,
        knownAssignees: ASSIGNEES.map((a) => a.name),
      },
      { status: 400 }
    );
  }

  const apiToken = process.env.CLICKUP_API_TOKEN;
  if (!apiToken || mock) {
    return NextResponse.json({
      tasks: mockTasks(assignee),
      mock: true,
      reason: apiToken ? "mock requested" : "CLICKUP_API_TOKEN not set",
    });
  }

  try {
    const all: NormalizedTask[] = [];
    const errors: string[] = [];

    // Filter lists by board selection ("GH", "Personal", etc.) or use all.
    const listsToQuery = board
      ? CLICKUP_LISTS.filter((l) => l.name.toLowerCase() === board.toLowerCase())
      : CLICKUP_LISTS;

    // Query each list filtered by assignee. ClickUp does not support
    // team-wide assignee filtering without a team-level endpoint that
    // requires different auth semantics; per-list is reliable.
    await Promise.all(
      listsToQuery.map(async (list) => {
        const params = new URLSearchParams({
          archived: "false",
          include_closed: "false",
          subtasks: "true",
          page: "0",
        });
        params.append("assignees[]", String(assigneeId));

        const url = `https://api.clickup.com/api/v2/list/${list.id}/task?${params.toString()}`;
        try {
          const res = await fetch(url, {
            headers: { Authorization: apiToken },
            cache: "no-store",
          });
          if (!res.ok) {
            errors.push(`${list.name}: ${res.status}`);
            return;
          }
          const data = await res.json();
          const tasks = Array.isArray(data.tasks) ? data.tasks : [];
          for (const raw of tasks) {
            const normalized = normalizeClickUpTask({
              ...raw,
              list: raw.list || { name: list.name },
            });
            all.push(normalized);
          }
        } catch (err) {
          errors.push(`${list.name}: ${err instanceof Error ? err.message : "fetch failed"}`);
        }
      })
    );

    return NextResponse.json({
      tasks: all,
      mock: false,
      errors: errors.length > 0 ? errors : undefined,
      assignee,
      assigneeId,
      board: board || "all",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch ClickUp tasks";
    console.error("ClickUp fetch error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/* ───────── Mock fallback ───────── */

function mockTasks(assignee: string): NormalizedTask[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const raw = [
    {
      id: "mock-1",
      name: "Review Q2 strategic roadmap and finalize priorities",
      status: "open",
      statusType: "open",
      priority: 2,
      priorityLabel: "high",
      dueDate: new Date(now + day * 2).toISOString(),
      tags: ["strategy"],
      description: "Align roadmap with team OKRs.",
      assignees: [assignee],
      timeEstimate: 75 * 60 * 1000,
    },
    {
      id: "mock-2",
      name: "Reply to vendor follow-up email",
      status: "open",
      statusType: "open",
      priority: 3,
      priorityLabel: "normal",
      dueDate: null,
      tags: [],
      description: "Quick response on pricing clarification.",
      assignees: [assignee],
      timeEstimate: 10 * 60 * 1000,
    },
    {
      id: "mock-3",
      name: "Draft onboarding doc for new hire",
      status: "open",
      statusType: "open",
      priority: 2,
      priorityLabel: "high",
      dueDate: new Date(now + day * 4).toISOString(),
      tags: [],
      description: "Write outline and first pass.",
      assignees: [assignee],
      timeEstimate: 60 * 60 * 1000,
    },
    {
      id: "mock-4",
      name: "Approve expense report — waiting on finance",
      status: "waiting",
      statusType: "open",
      priority: 3,
      priorityLabel: "normal",
      dueDate: null,
      tags: [],
      description: "Blocked until finance uploads backup docs.",
      assignees: [assignee],
      timeEstimate: 5 * 60 * 1000,
    },
    {
      id: "mock-5",
      name: "Plan tomorrow's meetings and block focus time",
      status: "open",
      statusType: "open",
      priority: 3,
      priorityLabel: "normal",
      dueDate: new Date(now + day * 1).toISOString(),
      tags: [],
      description: "Review calendar, add focus blocks.",
      assignees: [assignee],
      timeEstimate: 15 * 60 * 1000,
    },
  ];

  // Run through the regular inference pipeline so mock tasks look identical to real ones
  return raw.map((t) => {
    const withInferred: NormalizedTask = {
      id: t.id,
      name: t.name,
      assignees: t.assignees,
      status: t.status,
      statusType: t.statusType,
      priority: t.priority,
      priorityLabel: t.priorityLabel,
      dueDate: t.dueDate,
      tags: t.tags,
      description: t.description,
      timeEstimate: t.timeEstimate,
    };
    // Inline inference to keep mock self-contained:
    const hay = `${t.name} ${t.description}`.toLowerCase();
    withInferred.activationEnergy = /reply|ping|plan tomorrow|approve|clean/.test(hay)
      ? "low"
      : /draft|write|strategy|roadmap|design/.test(hay)
      ? "high"
      : "medium";
    withInferred.durationMinutes = t.timeEstimate ? Math.round(t.timeEstimate / 60000) : null;
    withInferred.isStrategic = /strategy|roadmap|plan|vision/.test(hay);
    withInferred.isBlocked = /waiting|blocked|pending/.test(hay);
    return withInferred;
  });
}

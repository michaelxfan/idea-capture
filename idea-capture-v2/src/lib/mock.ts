import { Task } from "./types";

const MOCK_RATIONALES: Record<string, string> = {
  Michael: "Requires your personal judgment or a decision only you can make.",
  Ann: "Delegatable admin/research task — Ann can execute with a clear instruction.",
  AI: "Creative/generative work that an AI agent can handle directly.",
  Later: "Not immediately actionable — parking lot for when the time is right.",
};

export function generateMockTasks(rawInput: string): Task[] {
  const lines = rawInput
    .split(/[\n.!?]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const dests = ["Michael", "Ann", "AI", "Later"] as const;

  const tasks: Task[] = (lines.length > 0 ? lines.slice(0, 3) : [rawInput]).map(
    (line, i) => {
      const dest = dests[i % 4];
      return {
        id: `mock-${Date.now()}-${i}`,
        rawInput: line,
        taskName: line.length > 60 ? line.slice(0, 57) + "..." : line,
        activationEnergy: (["low", "medium", "high"] as const)[i % 3],
        duration: ["15 min", "30 min", "1 hour"][i % 3],
        urgency: (["medium", "high", "low"] as const)[i % 3],
        importance: (["high", "medium", "low"] as const)[i % 3],
        whyRouted: MOCK_RATIONALES[dest],
        how: `Start by reviewing what "${line.slice(0, 30)}..." requires`,
        destination: dest,
        confidence: 0.7 + Math.random() * 0.25,
      };
    }
  );

  return tasks;
}

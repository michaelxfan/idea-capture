import { Task } from "./types";

const MOCK_RATIONALES: Record<string, string> = {
  Michael: "Requires your personal judgment or a decision only you can make.",
  Ann: "Delegatable admin/research task — Ann can execute with a clear instruction.",
  AI: "Creative/generative work that an AI agent can handle directly.",
  Later: "Not immediately actionable — parking lot for when the time is right.",
};

export function generateMockTasks(rawInput: string): Task[] {
  const dest = "Michael" as const;
  const task: Task = {
    id: `mock-${Date.now()}-0`,
    rawInput,
    taskName: rawInput.length > 60 ? rawInput.slice(0, 57) + "..." : rawInput,
    activationEnergy: "medium",
    duration: "30 min",
    urgency: "medium",
    importance: "high",
    whyRouted: MOCK_RATIONALES[dest],
    how: `Start by reviewing what "${rawInput.slice(0, 30)}..." requires`,
    destination: dest,
    confidence: 0.75,
    createdAt: new Date().toISOString(),
  };

  return [task];
}

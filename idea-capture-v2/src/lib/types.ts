export interface Task {
  id: string;
  rawInput: string;
  taskName: string;
  activationEnergy: "low" | "medium" | "high";
  duration: string;
  urgency: "low" | "medium" | "high";
  importance: "low" | "medium" | "high";
  whyRouted: string;
  how: string;
  destination: "Ann" | "AI" | "Michael" | "Later";
  confidence: number;
}

export type EnergyLevel = "low" | "medium" | "high";
export type Destination = "Ann" | "AI" | "Michael" | "Later";

export interface Task {
  id: string;
  rawInput: string;
  taskName: string;
  activationEnergy: "low" | "medium" | "high";
  duration: string;
  urgency: "low" | "medium" | "high";
  importance: "low" | "medium" | "high";
  whyRouted?: string;
  how?: string;
  destination: "Ann" | "AI" | "Michael" | "Later";
  confidence: number;
  createdAt: string;
  dueDate?: string;
  completed?: boolean;
  clickupTaskId?: string;
  clickupListName?: string;
  clickupUrl?: string;
  imageUrl?: string;
  emailContext?: EmailContext;
}

export interface EmailContext {
  subject?: string;
  from?: string;
  to?: string;
  cc?: string;
  date?: string;
  body: string;
  filename?: string;
}

export type EnergyLevel = "low" | "medium" | "high";
export type Destination = "Ann" | "AI" | "Michael" | "Later";

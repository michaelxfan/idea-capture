export type RelationshipStrength = "cold" | "neutral" | "aligned" | "sponsor";
export type GoalStatus = "open" | "in_progress" | "blocked" | "won" | "lost" | "parked";
export type OfferPriority = "high" | "medium" | "low";

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  team: string;
  managerName?: string;
  influenceScore: number;
  relationshipStrength: RelationshipStrength;
  impactAreas: string[];
  notes?: string;
  isInOffice: boolean;
  officeDays: string[];
  /** IDs of stakeholders this person influences downstream */
  influences: string[];
  orgChartImageRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  label: string;
  done: boolean;
  eta?: string;
}

export interface StakeholderGoals {
  id?: string;
  stakeholderId: string;
  goal1m?: string;
  goal3m?: string;
  goal12m?: string;
  whyItMattersToMe?: string;
  whyItMattersToThem?: string;
  blockers?: string;
  priorityLevel: number;
  status: GoalStatus;
  decisionDeadline?: string;
  compoundingRiskDays?: number;
  milestones: Milestone[];
}

export interface ReverseValue {
  id?: string;
  stakeholderId: string;
  howIHelpThem?: string;
  whatIOffer?: string;
  tradeOpportunities?: string;
  supportActions?: string;
  offerPriority: OfferPriority;
}

export interface AiInsights {
  id: string;
  stakeholderId: string;
  roleSynergies: string[];
  influenceRecommendations: string[];
  framingRecommendations: string[];
  likelyObjections: string[];
  recommendedLanguage: string[];
  inPersonTalkingPoints: string[];
  nextBestAction: string;
  generatedAt: string;
}

export interface OrgChartUpload {
  id: string;
  imageUrl?: string;
  extractedText?: string;
  parsingStatus: "pending" | "parsed" | "failed" | "manual";
  createdAt: string;
}

export interface InteractionLog {
  id: string;
  stakeholderId: string;
  interactionType?: string;
  summary?: string;
  occurredOn: string;
  followUpAction?: string;
  createdAt: string;
}

export interface DependencyBlock {
  stakeholderId: string;
  note?: string;
}

export interface DependencyBlockedBy {
  stakeholderId: string;
  reason?: string;
}

export interface StakeholderDependencies {
  id?: string;
  stakeholderId: string;
  blocks: DependencyBlock[];
  blockedBy: DependencyBlockedBy[];
}

export interface GapStep {
  label: string;
  done: boolean;
}

export interface GapAnalysis {
  id: string;
  stakeholderId: string;
  steps: GapStep[];
  generatedAt: string;
}

export interface LedgerEntry {
  id: string;
  stakeholderId: string;
  direction: "given" | "received";
  description: string;
  occurredOn: string;
  createdAt: string;
}

export interface StakeholderWithContext extends Stakeholder {
  goals?: StakeholderGoals;
  reverseValue?: ReverseValue;
  latestInsights?: AiInsights;
  priorityScore: number;
  leverageScore: number;
}

export interface ExtractedOrgPerson {
  name: string;
  title?: string;
  team?: string;
  managerName?: string;
}

import { getSupabase } from "./supabase";
import type {
  Stakeholder,
  StakeholderGoals,
  ReverseValue,
  AiInsights,
  InteractionLog,
  OrgChartUpload,
  RelationshipStrength,
  GoalStatus,
  OfferPriority,
  Milestone,
  StakeholderDependencies,
  DependencyBlock,
  DependencyBlockedBy,
  GapStep,
  GapAnalysis,
  LedgerEntry,
} from "./types";

/* ---------- row shapes ---------- */

interface StakeholderRow {
  id: string;
  name: string;
  title: string | null;
  team: string | null;
  manager_name: string | null;
  influence_score: number;
  relationship_strength: RelationshipStrength;
  impact_areas: string[] | null;
  notes: string | null;
  is_in_office: boolean;
  office_days: string[] | null;
  influences: string[] | null;
  org_chart_image_ref: string | null;
  created_at: string;
  updated_at: string;
}

interface GoalsRow {
  id: string;
  stakeholder_id: string;
  goal_1m: string | null;
  goal_3m: string | null;
  goal_12m: string | null;
  why_it_matters_to_me: string | null;
  why_it_matters_to_them: string | null;
  blockers: string | null;
  priority_level: number;
  status: GoalStatus;
  decision_deadline: string | null;
  compounding_risk_days: number | null;
  milestones: Milestone[] | null;
}

interface ReverseRow {
  id: string;
  stakeholder_id: string;
  how_i_help_them: string | null;
  what_i_offer: string | null;
  trade_opportunities: string | null;
  support_actions: string | null;
  offer_priority: OfferPriority | null;
}

interface InsightsRow {
  id: string;
  stakeholder_id: string;
  role_synergies: string[] | null;
  influence_recommendations: string[] | null;
  framing_recommendations: string[] | null;
  likely_objections: string[] | null;
  recommended_language: string[] | null;
  in_person_talking_points: string[] | null;
  next_best_action: string | null;
  generated_at: string;
}

interface InteractionRow {
  id: string;
  stakeholder_id: string;
  interaction_type: string | null;
  summary: string | null;
  occurred_on: string;
  follow_up_action: string | null;
  created_at: string;
}

interface UploadRow {
  id: string;
  image_url: string | null;
  extracted_text: string | null;
  parsing_status: "pending" | "parsed" | "failed" | "manual";
  created_at: string;
}

interface DependenciesRow {
  id: string;
  stakeholder_id: string;
  blocks: DependencyBlock[] | null;
  blocked_by: DependencyBlockedBy[] | null;
  created_at: string;
  updated_at: string;
}

interface GapStepsRow {
  id: string;
  stakeholder_id: string;
  steps: GapStep[] | null;
  generated_at: string;
}

interface LedgerRow {
  id: string;
  stakeholder_id: string;
  direction: "given" | "received";
  description: string;
  occurred_on: string;
  created_at: string;
}

/* ---------- mappers ---------- */

function rowToStakeholder(r: StakeholderRow): Stakeholder {
  return {
    id: r.id,
    name: r.name,
    title: r.title ?? "",
    team: r.team ?? "",
    managerName: r.manager_name ?? undefined,
    influenceScore: r.influence_score,
    relationshipStrength: r.relationship_strength,
    impactAreas: r.impact_areas ?? [],
    notes: r.notes ?? undefined,
    isInOffice: r.is_in_office,
    officeDays: r.office_days ?? [],
    influences: r.influences ?? [],
    orgChartImageRef: r.org_chart_image_ref ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToGoals(r: GoalsRow): StakeholderGoals {
  return {
    id: r.id,
    stakeholderId: r.stakeholder_id,
    goal1m: r.goal_1m ?? undefined,
    goal3m: r.goal_3m ?? undefined,
    goal12m: r.goal_12m ?? undefined,
    whyItMattersToMe: r.why_it_matters_to_me ?? undefined,
    whyItMattersToThem: r.why_it_matters_to_them ?? undefined,
    blockers: r.blockers ?? undefined,
    priorityLevel: r.priority_level,
    status: r.status,
    decisionDeadline: r.decision_deadline ?? undefined,
    compoundingRiskDays: r.compounding_risk_days ?? undefined,
    milestones: r.milestones ?? [],
  };
}

function rowToReverse(r: ReverseRow): ReverseValue {
  return {
    id: r.id,
    stakeholderId: r.stakeholder_id,
    howIHelpThem: r.how_i_help_them ?? undefined,
    whatIOffer: r.what_i_offer ?? undefined,
    tradeOpportunities: r.trade_opportunities ?? undefined,
    supportActions: r.support_actions ?? undefined,
    offerPriority: r.offer_priority ?? "medium",
  };
}

function rowToInsights(r: InsightsRow): AiInsights {
  return {
    id: r.id,
    stakeholderId: r.stakeholder_id,
    roleSynergies: r.role_synergies ?? [],
    influenceRecommendations: r.influence_recommendations ?? [],
    framingRecommendations: r.framing_recommendations ?? [],
    likelyObjections: r.likely_objections ?? [],
    recommendedLanguage: r.recommended_language ?? [],
    inPersonTalkingPoints: r.in_person_talking_points ?? [],
    nextBestAction: r.next_best_action ?? "",
    generatedAt: r.generated_at,
  };
}

function rowToInteraction(r: InteractionRow): InteractionLog {
  return {
    id: r.id,
    stakeholderId: r.stakeholder_id,
    interactionType: r.interaction_type ?? undefined,
    summary: r.summary ?? undefined,
    occurredOn: r.occurred_on,
    followUpAction: r.follow_up_action ?? undefined,
    createdAt: r.created_at,
  };
}

function rowToUpload(r: UploadRow): OrgChartUpload {
  return {
    id: r.id,
    imageUrl: r.image_url ?? undefined,
    extractedText: r.extracted_text ?? undefined,
    parsingStatus: r.parsing_status,
    createdAt: r.created_at,
  };
}

function rowToDependencies(r: DependenciesRow): StakeholderDependencies {
  return {
    id: r.id,
    stakeholderId: r.stakeholder_id,
    blocks: r.blocks ?? [],
    blockedBy: r.blocked_by ?? [],
  };
}

function rowToGapAnalysis(r: GapStepsRow): GapAnalysis {
  return {
    id: r.id,
    stakeholderId: r.stakeholder_id,
    steps: r.steps ?? [],
    generatedAt: r.generated_at,
  };
}

function rowToLedger(r: LedgerRow): LedgerEntry {
  return {
    id: r.id,
    stakeholderId: r.stakeholder_id,
    direction: r.direction,
    description: r.description,
    occurredOn: r.occurred_on,
    createdAt: r.created_at,
  };
}

/* ---------- stakeholders ---------- */

export async function listStakeholders(): Promise<Stakeholder[]> {
  const s = getSupabase();
  if (!s) return [];
  const { data, error } = await s
    .from("influence_stakeholders")
    .select("*")
    .order("influence_score", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) { console.error("listStakeholders:", error); return []; }
  return (data as StakeholderRow[]).map(rowToStakeholder);
}

export async function getStakeholder(id: string): Promise<Stakeholder | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s.from("influence_stakeholders").select("*").eq("id", id).single();
  if (error) { console.error("getStakeholder:", error); return null; }
  return rowToStakeholder(data as StakeholderRow);
}

export async function upsertStakeholder(
  input: Omit<Partial<Stakeholder>, "createdAt" | "updatedAt"> & { name: string }
): Promise<Stakeholder | null> {
  const s = getSupabase();
  if (!s) return null;
  const row: Partial<StakeholderRow> & { name: string } = {
    name: input.name,
    title: input.title ?? null,
    team: input.team ?? null,
    manager_name: input.managerName ?? null,
    influence_score: input.influenceScore ?? 3,
    relationship_strength: input.relationshipStrength ?? "neutral",
    impact_areas: input.impactAreas ?? [],
    notes: input.notes ?? null,
    is_in_office: input.isInOffice ?? false,
    office_days: input.officeDays ?? [],
    influences: input.influences ?? [],
    org_chart_image_ref: input.orgChartImageRef ?? null,
  };
  if (input.id) (row as StakeholderRow).id = input.id;

  const { data, error } = await s
    .from("influence_stakeholders")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();
  if (error) { console.error("upsertStakeholder:", error); return null; }
  return rowToStakeholder(data as StakeholderRow);
}

export async function deleteStakeholder(id: string): Promise<void> {
  const s = getSupabase();
  if (!s) return;
  const { error } = await s.from("influence_stakeholders").delete().eq("id", id);
  if (error) console.error("deleteStakeholder:", error);
}

/* ---------- goals ---------- */

export async function getGoals(stakeholderId: string): Promise<StakeholderGoals | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_stakeholder_goals")
    .select("*")
    .eq("stakeholder_id", stakeholderId)
    .maybeSingle();
  if (error) { console.error("getGoals:", error); return null; }
  return data ? rowToGoals(data as GoalsRow) : null;
}

export async function upsertGoals(g: StakeholderGoals): Promise<StakeholderGoals | null> {
  const s = getSupabase();
  if (!s) return null;
  const row = {
    stakeholder_id: g.stakeholderId,
    goal_1m: g.goal1m ?? null,
    goal_3m: g.goal3m ?? null,
    goal_12m: g.goal12m ?? null,
    why_it_matters_to_me: g.whyItMattersToMe ?? null,
    why_it_matters_to_them: g.whyItMattersToThem ?? null,
    blockers: g.blockers ?? null,
    priority_level: g.priorityLevel ?? 3,
    status: g.status ?? "open",
    decision_deadline: g.decisionDeadline ?? null,
    compounding_risk_days: g.compoundingRiskDays ?? null,
    milestones: g.milestones ?? [],
  };
  const { data, error } = await s
    .from("influence_stakeholder_goals")
    .upsert(row, { onConflict: "stakeholder_id" })
    .select()
    .single();
  if (error) { console.error("upsertGoals:", error); return null; }
  return rowToGoals(data as GoalsRow);
}

/* ---------- reverse value ---------- */

export async function getReverse(stakeholderId: string): Promise<ReverseValue | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_reverse_value")
    .select("*")
    .eq("stakeholder_id", stakeholderId)
    .maybeSingle();
  if (error) { console.error("getReverse:", error); return null; }
  return data ? rowToReverse(data as ReverseRow) : null;
}

export async function upsertReverse(r: ReverseValue): Promise<ReverseValue | null> {
  const s = getSupabase();
  if (!s) return null;
  const row = {
    stakeholder_id: r.stakeholderId,
    how_i_help_them: r.howIHelpThem ?? null,
    what_i_offer: r.whatIOffer ?? null,
    trade_opportunities: r.tradeOpportunities ?? null,
    support_actions: r.supportActions ?? null,
    offer_priority: r.offerPriority ?? "medium",
  };
  const { data, error } = await s
    .from("influence_reverse_value")
    .upsert(row, { onConflict: "stakeholder_id" })
    .select()
    .single();
  if (error) { console.error("upsertReverse:", error); return null; }
  return rowToReverse(data as ReverseRow);
}

/* ---------- insights ---------- */

export async function getLatestInsights(stakeholderId: string): Promise<AiInsights | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_ai_insights")
    .select("*")
    .eq("stakeholder_id", stakeholderId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.error("getLatestInsights:", error); return null; }
  return data ? rowToInsights(data as InsightsRow) : null;
}

export async function saveInsights(i: Omit<AiInsights, "id" | "generatedAt">): Promise<AiInsights | null> {
  const s = getSupabase();
  if (!s) return null;
  const row = {
    stakeholder_id: i.stakeholderId,
    role_synergies: i.roleSynergies,
    influence_recommendations: i.influenceRecommendations,
    framing_recommendations: i.framingRecommendations,
    likely_objections: i.likelyObjections,
    recommended_language: i.recommendedLanguage,
    in_person_talking_points: i.inPersonTalkingPoints,
    next_best_action: i.nextBestAction,
  };
  const { data, error } = await s
    .from("influence_ai_insights")
    .insert(row)
    .select()
    .single();
  if (error) { console.error("saveInsights:", error); return null; }
  return rowToInsights(data as InsightsRow);
}

export async function listRecentInsights(limit = 5): Promise<AiInsights[]> {
  const s = getSupabase();
  if (!s) return [];
  const { data, error } = await s
    .from("influence_ai_insights")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("listRecentInsights:", error); return []; }
  return (data as InsightsRow[]).map(rowToInsights);
}

/* ---------- interaction log ---------- */

export async function addInteraction(i: Omit<InteractionLog, "id" | "createdAt">): Promise<void> {
  const s = getSupabase();
  if (!s) return;
  await s.from("influence_interaction_log").insert({
    stakeholder_id: i.stakeholderId,
    interaction_type: i.interactionType ?? null,
    summary: i.summary ?? null,
    occurred_on: i.occurredOn,
    follow_up_action: i.followUpAction ?? null,
  });
}

export async function listInteractions(stakeholderId: string): Promise<InteractionLog[]> {
  const s = getSupabase();
  if (!s) return [];
  const { data, error } = await s
    .from("influence_interaction_log")
    .select("*")
    .eq("stakeholder_id", stakeholderId)
    .order("occurred_on", { ascending: false });
  if (error) { console.error("listInteractions:", error); return []; }
  return (data as InteractionRow[]).map(rowToInteraction);
}

/* ---------- org chart uploads ---------- */

export async function createUpload(u: Omit<OrgChartUpload, "id" | "createdAt">): Promise<OrgChartUpload | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_org_chart_uploads")
    .insert({
      image_url: u.imageUrl ?? null,
      extracted_text: u.extractedText ?? null,
      parsing_status: u.parsingStatus,
    })
    .select()
    .single();
  if (error) { console.error("createUpload:", error); return null; }
  return rowToUpload(data as UploadRow);
}

export async function listUploads(): Promise<OrgChartUpload[]> {
  const s = getSupabase();
  if (!s) return [];
  const { data, error } = await s
    .from("influence_org_chart_uploads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("listUploads:", error); return []; }
  return (data as UploadRow[]).map(rowToUpload);
}

/* ---------- dependencies (Feature 4) ---------- */

export async function getDependencies(stakeholderId: string): Promise<StakeholderDependencies | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_dependencies")
    .select("*")
    .eq("stakeholder_id", stakeholderId)
    .maybeSingle();
  if (error) { console.error("getDependencies:", error); return null; }
  return data ? rowToDependencies(data as DependenciesRow) : null;
}

export async function upsertDependencies(d: StakeholderDependencies): Promise<StakeholderDependencies | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_dependencies")
    .upsert({
      stakeholder_id: d.stakeholderId,
      blocks: d.blocks ?? [],
      blocked_by: d.blockedBy ?? [],
    }, { onConflict: "stakeholder_id" })
    .select()
    .single();
  if (error) { console.error("upsertDependencies:", error); return null; }
  return rowToDependencies(data as DependenciesRow);
}

/* ---------- gap analysis (Feature 5) ---------- */

export async function getLatestGapAnalysis(stakeholderId: string): Promise<GapAnalysis | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_gap_steps")
    .select("*")
    .eq("stakeholder_id", stakeholderId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.error("getLatestGapAnalysis:", error); return null; }
  return data ? rowToGapAnalysis(data as GapStepsRow) : null;
}

export async function saveGapAnalysis(stakeholderId: string, steps: GapStep[]): Promise<GapAnalysis | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_gap_steps")
    .insert({ stakeholder_id: stakeholderId, steps })
    .select()
    .single();
  if (error) { console.error("saveGapAnalysis:", error); return null; }
  return rowToGapAnalysis(data as GapStepsRow);
}

export async function updateGapSteps(id: string, steps: GapStep[]): Promise<void> {
  const s = getSupabase();
  if (!s) return;
  await s.from("influence_gap_steps").update({ steps }).eq("id", id);
}

/* ---------- ledger (Feature 10) ---------- */

export async function listLedger(stakeholderId?: string): Promise<LedgerEntry[]> {
  const s = getSupabase();
  if (!s) return [];
  let q = s.from("influence_ledger").select("*").order("occurred_on", { ascending: false });
  if (stakeholderId) q = q.eq("stakeholder_id", stakeholderId);
  const { data, error } = await q;
  if (error) { console.error("listLedger:", error); return []; }
  return (data as LedgerRow[]).map(rowToLedger);
}

export async function addLedgerEntry(e: Omit<LedgerEntry, "id" | "createdAt">): Promise<LedgerEntry | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data, error } = await s
    .from("influence_ledger")
    .insert({
      stakeholder_id: e.stakeholderId,
      direction: e.direction,
      description: e.description,
      occurred_on: e.occurredOn,
    })
    .select()
    .single();
  if (error) { console.error("addLedgerEntry:", error); return null; }
  return rowToLedger(data as LedgerRow);
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  const s = getSupabase();
  if (!s) return;
  await s.from("influence_ledger").delete().eq("id", id);
}

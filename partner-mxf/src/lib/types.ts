export type DriftLevel = "solid" | "light-drift" | "noticeable" | "friction";
export type ReplyConsistency = "yes" | "somewhat" | "no";
export type GuiltFlag = "guilt" | "avoidance" | "could-do-better" | "felt-distant" | "was-short";
export type RepairStyle = "words" | "time" | "acts" | "gifts" | "consistency";
export type CommSensitivity = "low" | "medium" | "high";
export type GiftSensitivity = "low" | "medium" | "high";
export type ConnectionFormat = "dinner" | "walk" | "call" | "shared-activity" | "low-key-hang";
export type ActionIntensity =
  | "none" | "message" | "voice-note" | "coffee-walk"
  | "dinner" | "gesture" | "quality-time-block";

export interface PartnerProfile {
  id: string;
  name: string;

  // Core Profile
  attachment_style: string | null;
  mbti: string | null;
  core_tension: string | null;
  push_pull_tendency: string | null;
  trust_curve: string | null;

  // Repair + Connection
  repair_style: RepairStyle;
  repair_style_ranking: string[]; // ordered, index 0 = highest priority
  comm_sensitivity: CommSensitivity;
  comm_sensitivity_internal: CommSensitivity | null;
  comm_sensitivity_note: string | null;
  gift_sensitivity: GiftSensitivity;
  gift_sensitivity_note: string | null;
  best_connection_format: ConnectionFormat;
  best_connection_secondary: ConnectionFormat | null;
  best_connection_note: string | null;

  // Behavioral Engine
  trigger_profile: string[];
  stress_response: string[];
  reengagement_pattern: string | null;
  trust_builders: string[];
  trust_breakers: string[];

  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  profile_id: string | null;
  log_date: string;
  replied_consistently: ReplyConsistency;
  initiated_contact: boolean;
  meaningful_connection: boolean;
  guilt_flags: GuiltFlag[];
  operator_mode: boolean;
  notes: string | null;
  created_at: string;
}

export interface RepairRecommendation {
  level: 0 | 1 | 2 | 3;
  drift_level: DriftLevel;
  drift_score: number;
  why: string;
  say_light: string;
  say_direct: string;
  say_warm: string;
  do: string;
  action_intensity: ActionIntensity;
  guardrail: string | null;
  generated_at: string;
}

export interface RepairOutcome {
  id: string;
  log_date: string;
  drift_level: DriftLevel;
  message_used: string | null;
  action_taken: string | null;
  landed: "yes" | "neutral" | "no" | null;
  overdid: boolean | null;
  underdid: boolean | null;
  notes: string | null;
  created_at: string;
}

export interface DashboardData {
  profile: PartnerProfile | null;
  recommendation: RepairRecommendation;
  last_meaningful: string | null;
  last_proactive: string | null;
  logged_today: boolean;
  recent_logs: DailyLog[];
}

// Analyze conversation types
export interface AnalysisResult {
  drift_level: DriftLevel;
  drift_score: number;
  situation_summary: string;
  emotional_dynamic: string;
  why: string;
  signals: string[];
  say_light: string;
  say_direct: string;
  say_warm: string;
  do: string;
  action_intensity: ActionIntensity;
  what_not_to_do: string;
  guardrail: string | null;
  confidence: "low" | "medium" | "high";
  profile_fit: string;
  follow_up_question: string;
}

export interface FollowUpResponse {
  perspective: string;
  follow_up_question: string | null; // null means conversation is naturally complete
}

export interface AnalyzeConversation {
  id: string;
  profile_id: string | null;
  summary: string | null;
  drift_level: DriftLevel | null;
  drift_score: number | null;
  created_at: string;
  messages?: AnalyzeMessage[];
}

export interface AnalyzeMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string; // JSON-stringified AnalysisResult | FollowUpResponse | plain user text
  created_at: string;
}

export interface AnalyzeOutcome {
  id: string;
  conversation_id: string | null;
  followed: "yes" | "partially" | "no";
  outcome: "helped" | "neutral" | "made-worse" | "too-early";
  situation_summary: string | null;
  recommended_action: string | null;
  recommended_message: string | null;
  what_not_to_do: string | null;
  notes: string | null;
  created_at: string;
}

export interface ConfidenceInfo {
  level: "low" | "medium" | "high";
  label: string;
  reason: string;
}

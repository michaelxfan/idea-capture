export type Domain = "work" | "health" | "social" | "admin" | "creative" | "personal";
export type EnergyLevel = "low" | "medium" | "high";
export type EmotionalTone = "calm" | "resistant" | "anxious" | "tired" | "excited" | "unclear";
export type Stakes = "low" | "medium" | "high";
export type CurrentMode = "A" | "B" | "mixed" | "unclear";
export type BClassification = "strategic" | "protective" | "avoidant" | "healthy" | "mixed" | "unclear";
export type ThresholdType =
  | "time"
  | "energy"
  | "ambiguity"
  | "emotional_discomfort"
  | "social_risk"
  | "uncertainty"
  | "friction"
  | "mixed"
  | "unclear";
export type AiStatus = "pending" | "ready" | "failed";
export type OutcomeStatus =
  | "stayed_in_a"
  | "switched_to_b"
  | "b_was_correct"
  | "regretted_switch"
  | "learned"
  | null;

export type ModeClassification = "Advance" | "Stabilize" | "Recover" | "Escape";
export type TimeOfDayBucket = "morning" | "midday" | "afternoon" | "evening" | "night";
export type DayType =
  | "advance_dominant"
  | "stabilize_dominant"
  | "recovery_dominant"
  | "mixed";

export interface Interpretation {
  a_intention: string;
  b_intention: string;
  threshold_type: ThresholdType;
  threshold_description: string;
  current_mode: CurrentMode;
  evidence: string;
  b_classification: BClassification;
  recommendation: string;
  minimum_viable_a: string;
}

export interface Capture extends Partial<Interpretation> {
  id: string;
  user_id: string;
  created_at: string;
  domain: Domain | null;
  situation_text: string;
  time_available_minutes: number | null;
  energy_level: EnergyLevel | null;
  emotional_tone: EmotionalTone | null;
  stakes: Stakes | null;
  ai_status: AiStatus;
  outcome_status: OutcomeStatus;
  reflection_note: string | null;

  // derived / classification
  mode_classification?: ModeClassification | null;
  was_correct_mode?: boolean | null;
  threshold_triggered?: boolean | null;
  time_of_day_bucket?: TimeOfDayBucket | null;
}

// Optional Whoop-style signal that feeds classifyDay.
// TODO: wire to real Whoop API (sleep, recovery, strain, HRV).
export interface WhoopData {
  sleep_hours?: number | null;
  recovery_pct?: number | null;
  nap_count?: number | null;
  hrv?: number | null;
}

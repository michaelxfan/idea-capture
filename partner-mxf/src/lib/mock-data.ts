import type {
  DailyLog,
  PartnerProfile,
  RepairOutcome,
  AnalyzeConversation,
} from "./types";

export const MOCK_PROFILE: PartnerProfile = {
  id: "mock-profile-1",
  name: "Your Partner",

  // Core Profile
  attachment_style: "Fearful Avoidant",
  mbti: null,
  core_tension:
    "Wants closeness but can feel overwhelmed, controlled, or unsafe when intimacy becomes too intense.",
  push_pull_tendency: "high",
  trust_curve:
    "Slow to build, easy to disrupt, rebuilt through repeated consistency over time.",

  // Repair + Connection
  repair_style: "time",
  repair_style_ranking: ["time", "consistency", "acts", "words", "gifts"],
  comm_sensitivity: "medium",
  comm_sensitivity_internal: "high",
  comm_sensitivity_note:
    "May notice communication changes strongly internally but not always express it directly.",
  gift_sensitivity: "low",
  gift_sensitivity_note:
    "Gifts should feel natural and specific, not performative or compensatory.",
  best_connection_format: "low-key-hang",
  best_connection_secondary: "shared-activity",
  best_connection_note:
    "Best connection comes from calm, grounded time together rather than high-pressure emotional processing.",

  // Behavioral Engine
  trigger_profile: [
    "Sudden changes in communication patterns",
    "Feeling pressured, controlled, or cornered",
    "Emotional intensity escalating too quickly",
    "Mixed signals or unpredictability",
    "Conflict that stays unresolved",
    "Feeling like repair is performative rather than genuine",
  ],
  stress_response: [
    "Withdraws or goes quiet",
    "Overthinks internally",
    "Delays responses",
    "Becomes inconsistent",
    "May push away while still wanting connection",
  ],
  reengagement_pattern:
    "Needs time and space first, then returns through small, low-pressure contact. Best re-engagement is calm, warm, and non-demanding.",
  trust_builders: [
    "Consistent follow-through",
    "Calm tone",
    "Giving space without disappearing",
    "Small thoughtful actions",
    "Showing up repeatedly",
    "Low-pressure invitations",
  ],
  trust_breakers: [
    "Over-texting after distance",
    "Dramatic apologies without changed behavior",
    "Pressuring for immediate emotional clarity",
    "Inconsistency",
    "Big gifts that feel like compensation",
    "Turning every issue into a heavy relationship talk",
  ],

  notes: "Values presence over words. Notices when you're distracted.",
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export const MOCK_LOGS: DailyLog[] = [
  {
    id: "log-0",
    profile_id: "mock-profile-1",
    log_date: daysAgo(0),
    replied_consistently: "somewhat",
    initiated_contact: false,
    meaningful_connection: false,
    guilt_flags: ["could-do-better"],
    operator_mode: true,
    notes: "Back to back meetings, barely looked up.",
    created_at: new Date().toISOString(),
  },
  {
    id: "log-1",
    profile_id: "mock-profile-1",
    log_date: daysAgo(1),
    replied_consistently: "no",
    initiated_contact: false,
    meaningful_connection: false,
    guilt_flags: ["felt-distant", "avoidance"],
    operator_mode: true,
    notes: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "log-2",
    profile_id: "mock-profile-1",
    log_date: daysAgo(2),
    replied_consistently: "somewhat",
    initiated_contact: false,
    meaningful_connection: false,
    guilt_flags: [],
    operator_mode: true,
    notes: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "log-3",
    profile_id: "mock-profile-1",
    log_date: daysAgo(3),
    replied_consistently: "yes",
    initiated_contact: true,
    meaningful_connection: true,
    guilt_flags: [],
    operator_mode: false,
    notes: "Good dinner together, felt connected.",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "log-4",
    profile_id: "mock-profile-1",
    log_date: daysAgo(4),
    replied_consistently: "yes",
    initiated_contact: true,
    meaningful_connection: false,
    guilt_flags: [],
    operator_mode: false,
    notes: null,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "log-5",
    profile_id: "mock-profile-1",
    log_date: daysAgo(5),
    replied_consistently: "yes",
    initiated_contact: false,
    meaningful_connection: true,
    guilt_flags: [],
    operator_mode: false,
    notes: "Long walk, good talk.",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "log-6",
    profile_id: "mock-profile-1",
    log_date: daysAgo(6),
    replied_consistently: "yes",
    initiated_contact: true,
    meaningful_connection: false,
    guilt_flags: [],
    operator_mode: false,
    notes: null,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

export const MOCK_OUTCOMES: RepairOutcome[] = [
  {
    id: "outcome-1",
    log_date: daysAgo(10),
    drift_level: "light-drift",
    message_used: "Hey, I've been a bit in my own world — how's your day been?",
    action_taken: "coffee-walk",
    landed: "yes",
    overdid: false,
    underdid: false,
    notes: "She appreciated the walk. Light touch was right.",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "outcome-2",
    log_date: daysAgo(21),
    drift_level: "noticeable",
    message_used:
      "I feel like I've been a bit off the grid lately — not intentional. Want to catch up properly this week?",
    action_taken: "dinner",
    landed: "yes",
    overdid: false,
    underdid: false,
    notes: "Dinner worked well. Direct message was the right call.",
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
];

export const MOCK_CONVERSATIONS: AnalyzeConversation[] = [
  {
    id: "conv-1",
    profile_id: "mock-profile-1",
    summary:
      "3 days of low comms after hosting brother. Recommended calm re-engagement, low-key hang.",
    drift_level: "noticeable",
    drift_score: 58,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "conv-2",
    profile_id: "mock-profile-1",
    summary:
      "Slight distance noticed after busy week. Recommended warm message, no overcorrection.",
    drift_level: "light-drift",
    drift_score: 32,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
];

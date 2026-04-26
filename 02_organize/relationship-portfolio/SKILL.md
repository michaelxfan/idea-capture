---
name: relationship-portfolio-mgmt
description: >
  A personal relationship portfolio management system. Tracks, scores, and helps prioritize the people in your network — like a portfolio of relationships. Use this skill whenever the user wants to: add or update a person in their network, log an interaction, view their relationship dashboard, get weekly recommendations on who to reach out to, run a relationship review, see who is drifting, check their relationship scores, manage their relationship portfolio, or think about who to message or schedule time with next. Triggers on phrases like: "open my relationship dashboard", "add someone to my network", "log a conversation with", "who should I message this week", "who is drifting", "run my relationship review", "update my relationship with", "show my priority queue", "relationship portfolio", "who should I reach out to", "add a person", "log an interaction", "relationship scores", "who to deepen", "warm up a connection", "track a relationship".
---

# Relationship Portfolio Management

You are managing a thoughtful, personal relationship operating system. This is NOT a corporate CRM. It is a lightweight, emotionally intelligent system for tracking relationships, reducing cognitive load, and helping the user invest in the people who matter most.

The goal: help the user expand their luck surface area and social capital while keeping things human, specific, and strategic.

---

## File Locations

- **People data**: `~/relationship-portfolio/people.json`
- **Interactions**: `~/relationship-portfolio/interactions.json`
- **Score history**: `~/relationship-portfolio/scores_history.json`
- **Config**: `~/relationship-portfolio/config.json`
- **Dashboard**: `~/relationship-portfolio/dashboard.html`

Create directory if needed: `mkdir -p ~/relationship-portfolio/`

On first run, copy config from skill default:
- Source: `~/Desktop/relationship-portfolio-mgmt/config.default.json` → `~/relationship-portfolio/config.json`
- Source: `~/Desktop/relationship-portfolio-mgmt/seed_data.json` → seed people.json and interactions.json

---

## Data Schemas

### people.json
```json
{
  "people": [
    {
      "id": "kebab-case-unique-id",
      "full_name": "string",
      "nickname": "string or null",
      "category": "close_friend | friend | family | dating | professional | mentor | collaborator | acquaintance | aspirational",
      "relationship_stage": "seed | warm | active | deep | drifting",
      "tier": "Tier 1 | Tier 2 | Tier 3 | Tier 4",
      "manual_tier_override": "Tier 1 | Tier 2 | Tier 3 | Tier 4 | null",
      "company": "string or null",
      "role": "string or null",
      "city": "string or null",
      "timezone": "string or null",
      "where_we_met": "string",
      "tags": ["array", "of", "strings"],
      "notes_about_them": "string",
      "things_to_remember": "string",
      "interests": ["array", "of", "strings"],
      "relationship_goals": "string",
      "last_contact_date": "YYYY-MM-DD or null",
      "last_seen_in_person_date": "YYYY-MM-DD or null",
      "last_meaningful_interaction_date": "YYYY-MM-DD or null",
      "relationship_start_year": 2020,
      "interaction_frequency_target": "daily | weekly | biweekly | monthly | quarterly | biannual",
      "preferred_channel": "text | whatsapp | instagram | email | call | in_person",
      "closeness_score": 7,
      "trust_score": 8,
      "energy_score": 8,
      "reciprocity_score": 7,
      "future_upside_score": 6,
      "mutual_support_score": 7,
      "access_score": 5,
      "health_trend": "strengthening | stable | drifting | reactivated",
      "snoozed_until": "YYYY-MM-DD or null",
      "do_not_prioritize": false
    }
  ]
}
```

### interactions.json
```json
{
  "interactions": [
    {
      "id": "unique-id",
      "person_id": "kebab-case-person-id",
      "date": "YYYY-MM-DD",
      "interaction_type": "text | call | coffee | dinner | event | party | trip | intro | email | social_reply | whatsapp",
      "interaction_quality_score": 7,
      "interaction_depth_score": 6,
      "initiated_by": "me | them | other",
      "notes": "string",
      "followup_needed": false,
      "followup_date": "YYYY-MM-DD or null",
      "tags": ["array"]
    }
  ]
}
```

### scores_history.json
```json
{
  "snapshots": [
    {
      "person_id": "string",
      "timestamp": "ISO-8601",
      "overall_score": 78,
      "closeness": 82,
      "momentum": 65,
      "strategic_value": 70,
      "energy_reciprocity": 85,
      "drift_risk": 20,
      "reason": "string describing what changed"
    }
  ]
}
```

---

## Operations

### 1. First-Time Setup (Questionnaire)

When the user says "set up my relationship portfolio" or invokes for the first time with no existing data, run this thoughtful onboarding flow. Ask these questions conversationally (not all at once — 2-3 at a time):

**Questions to ask:**
1. "Which relationship categories matter most to you right now? (e.g., close friends, mentors, collaborators, dating, professional network)"
2. "When you think about the most important people in your life — who comes to mind immediately? Let's add them first."
3. "What's your biggest relationship challenge right now: drifting from people, not deepening enough, or not knowing who to prioritize?"
4. "Are you optimizing more for closeness and depth, or opportunity and strategic value, or both equally?"
5. "How often do you ideally want to see your closest friends? (e.g., weekly, monthly, etc.)"
6. "What makes someone 'high upside' in your world — is it about ideas, opportunities, inspiration, emotional support, something else?"
7. "Are there categories you want to invest in more intentionally right now? (e.g., mentors, collaborators, reconnecting with old friends)"
8. "What kind of interaction feels most meaningful to you: deep 1:1 conversations, group experiences, regular lightweight check-ins?"

Then:
- Save answers to `~/relationship-portfolio/config.json` (adjust scoring weights accordingly)
- Suggest 3-5 seed people to add based on their answers
- Ask if they want to use example data to start (from seed_data.json) or start fresh

**Weight adjustments based on answers:**
- If they value closeness+depth → increase closeness weight to 0.35, decrease strategic to 0.15
- If they value opportunity+strategy → increase strategic weight to 0.30, closeness to 0.25
- If they value energy+reciprocity → increase energy_reciprocity to 0.35
- If they mention "drifting" as main problem → increase momentum weight to 0.30

---

### 2. Add a Person

When the user says "add [name]" or "track [name]":

1. Ask for: name, category, how they met, city, role/company, and any key notes.
2. For scores, ask conversational questions:
   - "On a scale of 1-10, how close do you feel to [name]?"
   - "How energizing is this relationship? (1-10)"
   - "How would you rate their reciprocity — do they invest back? (1-10)"
   - "How much potential upside does this relationship have for your life/work? (1-10)"
3. Generate an `id` from the name (kebab-case, e.g., "alex-chen").
4. Compute initial tier using the auto-tiering logic.
5. Append to `people.json`.
6. Snapshot initial scores to `scores_history.json`.
7. Regenerate dashboard and open it.

---

### 3. Update a Person

When the user wants to update fields for someone:
1. Find by name (fuzzy match).
2. Apply the changes.
3. If scores changed, snapshot to scores_history.json with reason.
4. Regenerate dashboard and open it.

---

### 4. Log an Interaction

When the user says "I talked to [name]" or "log a conversation with [name]":

1. Ask: date (default today), interaction type, quality (1-10), depth (1-10), who initiated, any notes, follow-up needed?
2. Append to `interactions.json`.
3. Update `last_contact_date`, `last_meaningful_interaction_date` on the person.
4. If in-person interaction: update `last_seen_in_person_date`.
5. Recompute scores and update person's tier if auto-tier changed.
6. Snapshot scores to `scores_history.json` with reason = "Interaction logged".
7. Regenerate dashboard and open it.

---

### 5. View Dashboard

Just open: `open ~/relationship-portfolio/dashboard.html`

If no dashboard exists yet, generate it first.

---

### 6. Weekly Relationship Review

When user says "run my relationship review" or "weekly review":

1. Read all data.
2. Compute scores for every person.
3. Identify:
   - People overdue for contact (days since last contact > cadence target)
   - Drifting relationships (momentum < 40 AND tier 1 or 2)
   - Pending follow-ups
   - Rising momentum (recent high-quality interactions)
4. Generate a summary with specific recommended actions.
5. Regenerate dashboard.
6. Print a clean text summary.

---

### 7. Quick Add (Lightweight)

"Quick add: [Name], [category], [one sentence about them]"
- Create minimal profile, use defaults for scores (5 across the board).
- Skip questionnaire. Generate ID, append to people.json.
- Regenerate dashboard.

---

### 8. Snooze / Defer

"Snooze [name] for 2 weeks" → set `snoozed_until` to date 2 weeks from now.
"Do not prioritize [name]" → set `do_not_prioritize: true`.
These people are hidden from recommendation queue but still in directory.

---

## Scoring Engine

The following JavaScript scoring logic should be embedded in the dashboard HTML. All scores are 0–100. Comments explain the reasoning behind each formula.

```javascript
// =============================================================
// RELATIONSHIP PORTFOLIO — SCORING ENGINE
// All functions take (person, interactions, config) and return 0–100
// Edit scoring weights in config.json to tune behavior
// =============================================================

const TODAY = new Date();

function daysSince(dateStr) {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((TODAY - d) / 86400000));
}

// --- COMPONENT 1: CLOSENESS SCORE (0-100) ---
// What it measures: emotional depth, trust, history, and in-person richness.
// Why this matters: closeness is the foundation of a durable relationship.
// It's input-heavy (manual scores) because only you know how close you really feel.
function computeCloseness(person, interactions, config) {
  const w = config.closeness_components;

  // Emotional intimacy: direct self-report, normalized to 0–100
  const intimacy = (person.closeness_score || 5) * 10;

  // Trust: self-report, normalized
  const trust = (person.trust_score || 5) * 10;

  // History length: longer relationships have built-in resilience.
  // Cap at history_years_cap (default 12) to prevent very old relationships from dominating.
  const yearsKnown = person.relationship_start_year
    ? Math.min(TODAY.getFullYear() - person.relationship_start_year, config.history_years_cap || 12)
    : 0;
  const history = Math.min((yearsKnown / (config.history_years_cap || 12)) * 100, 100);

  // In-person depth: count richness-weighted in-person interactions (last 12 months)
  const cutoff = new Date(TODAY); cutoff.setFullYear(cutoff.getFullYear() - 1);
  const inPersonTypes = ['coffee', 'dinner', 'event', 'party', 'trip'];
  const depthMultipliers = config.interaction_type_depth_multiplier || {};
  let inPersonScore = 0;
  interactions.forEach(i => {
    if (new Date(i.date) >= cutoff && inPersonTypes.includes(i.interaction_type)) {
      const mult = depthMultipliers[i.interaction_type] || 1.0;
      inPersonScore += (i.interaction_quality_score / 10) * mult * 12;
    }
  });
  inPersonScore = Math.min(inPersonScore, 100);

  return (
    intimacy    * w.emotional_intimacy +
    trust       * w.trust +
    history     * w.history +
    inPersonScore * w.in_person_depth
  );
}

// --- COMPONENT 2: MOMENTUM SCORE (0-100) ---
// What it measures: how alive and active the relationship is right now.
// Uses exponential decay — silence erodes momentum faster for Tier 1 than Tier 4.
// Why exponential? A relationship that felt strong 6 months ago shouldn't
// stay "high momentum" indefinitely just from old history.
function computeMomentum(person, interactions, config) {
  const w = config.momentum_components;
  const tier = person.tier || 'Tier 3';
  const halfLife = (config.momentum_half_life_days || {})[tier] || 45;

  // Recency of any contact: exponential decay from last_contact_date
  // score = 100 * 0.5^(days/halfLife)
  const daysSinceContact = daysSince(person.last_contact_date);
  const recencyContact = 100 * Math.pow(0.5, daysSinceContact / halfLife);

  // Recency of in-person: weighted heavier because in-person interactions
  // build momentum more than text/email. Uses a slower half-life (1.5x).
  const daysSinceInPerson = daysSince(person.last_seen_in_person_date);
  const recencyInPerson = 100 * Math.pow(0.5, daysSinceInPerson / (halfLife * 1.5));

  // Recent interaction quality trend: average quality of last 3 interactions.
  // Penalizes shallow/low-quality recent interactions even if frequent.
  const recent = interactions
    .filter(i => i.person_id === person.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  const avgQuality = recent.length
    ? (recent.reduce((s, i) => s + (i.interaction_quality_score || 5), 0) / recent.length) * 10
    : 30; // Default: assume moderate if no data

  return (
    recencyContact * w.recency_contact +
    recencyInPerson * w.recency_in_person +
    avgQuality * w.interaction_quality_trend
  );
}

// --- COMPONENT 3: STRATEGIC / LIFE VALUE SCORE (0-100) ---
// What it measures: how much this relationship contributes to your growth,
// opportunities, inspiration, mutual support, and life satisfaction.
// Intentionally separated from closeness — some relationships are strategically
// important without being deeply close (yet), and vice versa.
function computeStrategicValue(person, config) {
  const w = config.strategic_components;

  // Future upside: potential for this relationship to contribute to your
  // work, growth, opportunities, or life in a meaningful way
  const upside = (person.future_upside_score || 5) * 10;

  // Mutual support: does this person genuinely show up for you (and vice versa)?
  const support = (person.mutual_support_score || 5) * 10;

  // Access: does this person give you access to ideas, opportunities,
  // networks, perspectives, or people you wouldn't have otherwise?
  const access = (person.access_score || 5) * 10;

  // Life importance: a fixed weight based on category, reflecting how
  // important people in this category typically are to your life.
  const catImportance = config.category_life_importance || {};
  const lifeImportance = ((catImportance[person.category] || 0.5) * 100);

  return (
    upside         * w.future_upside +
    support        * w.mutual_support +
    access         * w.access_ideas_opportunity +
    lifeImportance * w.life_importance
  );
}

// --- COMPONENT 4: ENERGY / RECIPROCITY SCORE (0-100) ---
// What it measures: does this relationship feel energizing or draining?
// Is effort mutual? Does this person invest back?
// Why this matters: a high-closeness, high-strategic relationship that
// consistently drains you is not a portfolio asset — it's a liability.
function computeEnergyReciprocity(person, interactions, config) {
  const w = config.energy_components;

  const energy = (person.energy_score || 5) * 10;
  const reciprocity = (person.reciprocity_score || 5) * 10;

  // Average quality of last 5 interactions (quality captures how good it felt)
  const recent = interactions
    .filter(i => i.person_id === person.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  const avgQuality = recent.length
    ? (recent.reduce((s, i) => s + (i.interaction_quality_score || 5), 0) / recent.length) * 10
    : 50;

  return (
    energy      * w.energy_score +
    reciprocity * w.reciprocity_score +
    avgQuality  * w.avg_interaction_quality
  );
}

// --- COMPONENT 5: DRIFT RISK SCORE (0-100) ---
// What it measures: how at-risk is this relationship of fading?
// Higher score = more drift risk = needs more urgent attention.
// Formula: how far past the ideal cadence are we, weighted by tier importance.
// A Tier 1 friend 60 days overdue is far more alarming than a T4 acquaintance.
function computeDriftRisk(person, interactions, config) {
  const tier = person.tier || 'Tier 3';
  const category = person.category || 'friend';
  const tierMultiplier = (config.drift_risk_multipliers || {})[tier] || 1.0;

  // Get ideal cadence in days
  const cadenceConfig = config.cadence_days || {};
  const tierCadence = cadenceConfig[tier] || {};
  const idealDays = tierCadence[category] || tierCadence.default || 60;

  const daysSinceContact = daysSince(person.last_contact_date);

  // Days overdue = how much past the ideal cadence we are
  const daysOverdue = Math.max(0, daysSinceContact - idealDays);

  // Risk score: 0 if on schedule, scales to 100 as overdue grows.
  // Amplified by tier multiplier — high tier = higher risk for same overdue.
  // Cap at 100. The formula: min(100, (daysOverdue / idealDays) * 50 * tierMultiplier)
  // This means: being 2x overdue at Tier 1 (mult=2.0) = risk of 100.
  const rawRisk = (daysOverdue / Math.max(idealDays, 1)) * 50 * tierMultiplier;

  // Snoozed people have no drift risk (user intentionally paused)
  if (person.snoozed_until && new Date(person.snoozed_until) > TODAY) return 0;
  if (person.do_not_prioritize) return 0;

  return Math.min(100, rawRisk);
}

// --- OVERALL RELATIONSHIP SCORE (0-100) ---
// Weighted combination of the 4 positive components.
// Drift risk is NOT included here — it's used separately for prioritization.
// This score reflects relationship quality, not urgency.
function computeOverallScore(closeness, momentum, strategic, energy, config) {
  const w = config.scoring_weights;
  return (
    closeness * w.closeness +
    momentum  * w.momentum +
    strategic * w.strategic_value +
    energy    * w.energy_reciprocity
  );
}

// --- PORTFOLIO PRIORITY SCORE (0-100) ---
// This is what determines who floats to the top of the priority queue.
// It blends overall quality WITH urgency (drift risk).
// Someone strong but overdue should outrank someone strong but recently contacted.
// Formula: 60% quality + 40% urgency (drift risk).
function computePriorityScore(overallScore, driftRisk) {
  return (overallScore * 0.60) + (driftRisk * 0.40);
}

// --- AUTO-TIER LOGIC ---
// Used when manual_tier_override is null.
// Blends score + category to assign a tier.
function computeAutoTier(person, overallScore, config) {
  if (person.manual_tier_override) return person.manual_tier_override;

  const highValueCategories = ['close_friend', 'family', 'dating'];
  const midValueCategories = ['mentor', 'collaborator', 'friend'];
  const thresholds = config.auto_tier_thresholds || {};

  // Tier 1: High score OR high-value category with decent closeness
  if (overallScore >= ((thresholds['Tier 1'] || {}).min_overall_score || 72)) return 'Tier 1';
  if (highValueCategories.includes(person.category) && (person.closeness_score || 0) >= 7) return 'Tier 1';

  // Tier 2: Meaningful score or strategic/mentor relationships
  if (overallScore >= ((thresholds['Tier 2'] || {}).min_overall_score || 50)) return 'Tier 2';
  if (midValueCategories.includes(person.category) && overallScore >= 40) return 'Tier 2';

  // Tier 3: Moderate score
  if (overallScore >= ((thresholds['Tier 3'] || {}).min_overall_score || 28)) return 'Tier 3';

  return 'Tier 4';
}

// --- COMPUTE ALL SCORES FOR ONE PERSON ---
function scoreOnePerson(person, interactions, config) {
  const myInteractions = interactions.filter(i => i.person_id === person.id);
  const closeness = computeCloseness(person, myInteractions, config);
  const momentum  = computeMomentum(person, myInteractions, config);
  const strategic = computeStrategicValue(person, config);
  const energy    = computeEnergyReciprocity(person, myInteractions, config);
  const driftRisk = computeDriftRisk(person, myInteractions, config);
  const overall   = computeOverallScore(closeness, momentum, strategic, energy, config);
  const priority  = computePriorityScore(overall, driftRisk);
  const tier      = computeAutoTier(person, overall, config);

  return { closeness, momentum, strategic, energy, driftRisk, overall, priority, tier };
}

// --- RECOMMENDATION ENGINE ---
// Generates the priority queue and weekly action plan.
// Uses: tier, drift risk, days overdue, interaction quality trend, reciprocity.
function generateRecommendations(people, interactions, config) {
  const rcfg = config.recommendations || {};

  // Score everyone
  const scored = people
    .filter(p => !p.do_not_prioritize)
    .filter(p => !p.snoozed_until || new Date(p.snoozed_until) <= TODAY)
    .map(p => {
      const s = scoreOnePerson(p, interactions, config);
      const cadenceConfig = config.cadence_days || {};
      const tierCadence = cadenceConfig[s.tier] || cadenceConfig[p.tier] || {};
      const idealDays = tierCadence[p.category] || tierCadence.default || 60;
      const dsc = daysSince(p.last_contact_date);
      const overdue = Math.max(0, dsc - idealDays);
      return { person: p, scores: s, daysOverdue: overdue, daysSinceContact: dsc, idealDays };
    })
    .sort((a, b) => b.scores.priority - a.scores.priority);

  // Message this week: overdue for text/call, ranked by priority
  const messageQueue = scored
    .filter(x => x.daysOverdue > 0 && x.scores.overall > 35)
    .slice(0, rcfg.message_this_week || 5);

  // Schedule hangout: in-person candidates (Tier 1/2, overdue for in-person)
  const hangoutQueue = scored
    .filter(x => ['Tier 1', 'Tier 2'].includes(x.scores.tier))
    .filter(x => daysSince(x.person.last_seen_in_person_date) > 45)
    .slice(0, rcfg.schedule_hangout || 2);

  // Deepen: high upside + good closeness + not yet deep
  const deepenQueue = scored
    .filter(x => x.scores.strategic > 60 && x.scores.closeness > 40 && x.person.relationship_stage !== 'deep')
    .slice(0, rcfg.deepen || 1);

  // Re-engage: drifting but important (was high closeness, now low momentum)
  const reengageQueue = scored
    .filter(x => x.scores.closeness > 60 && x.scores.momentum < 35)
    .slice(0, rcfg.reengage || 1);

  // Drifting alerts: overdue relative to tier/closeness, high drift risk
  const driftingAlerts = scored
    .filter(x => x.scores.driftRisk > 55)
    .sort((a, b) => b.scores.driftRisk - a.scores.driftRisk)
    .slice(0, 5);

  return { messageQueue, hangoutQueue, deepenQueue, reengageQueue, driftingAlerts, fullQueue: scored };
}

// --- GENERATE NEXT SUGGESTED ACTION ---
// Returns a short, human, specific suggestion string.
function suggestAction(person, scores, interactions, config) {
  if (person.do_not_prioritize) return 'Not currently prioritized';
  if (person.snoozed_until && new Date(person.snoozed_until) > TODAY)
    return `Snoozed until ${person.snoozed_until}`;

  const dsc = daysSince(person.last_contact_date);
  const dsip = daysSince(person.last_seen_in_person_date);
  const channel = person.preferred_channel || 'text';
  const nick = person.nickname || person.full_name.split(' ')[0];

  // Check for pending follow-ups
  const pending = interactions
    .filter(i => i.person_id === person.id && i.followup_needed && i.followup_date)
    .sort((a, b) => new Date(a.followup_date) - new Date(b.followup_date))[0];
  if (pending && new Date(pending.followup_date) <= TODAY)
    return `Follow up: ${pending.notes?.slice(0, 60) || 'pending item from last conversation'}`;

  // Drifting + high closeness = urgent re-engagement
  if (scores.driftRisk > 70 && scores.closeness > 60)
    return `Re-engage — it's been ${dsc} days. A direct invite or voice note would land well.`;

  // Long since in person
  if (dsip > 60 && ['Tier 1', 'Tier 2'].includes(scores.tier))
    return `Plan in-person time — ${dsip} days since you last saw them. Suggest coffee or dinner.`;

  // Generic: send a lightweight touch based on preferred channel
  if (dsc > 14 && scores.tier === 'Tier 1') {
    const thing = person.things_to_remember?.split('.')[0] || 'what they've been up to';
    return `Send a quick ${channel === 'call' ? 'call or voice note' : channel} — ask about ${thing}`;
  }

  if (dsc > 30 && scores.tier === 'Tier 2')
    return `Check in — it's been ${dsc} days. A specific, direct message works best.`;

  if (scores.strategic > 65 && dsc > 45)
    return `High-value relationship — share something relevant to their interests or ask a specific question.`;

  if (person.relationship_stage === 'seed')
    return `Warm up — respond to something they've shared or reference your last conversation.`;

  return `Stay warm — a lightweight touch in the next week would be good timing.`;
}
```

---

## Trend Labels

Assign a `health_trend` label when updating a person or after logging an interaction:
- **strengthening**: momentum increased by 10+ points in last 60 days, or recent interactions avg quality 8+
- **stable**: momentum within ±15 of 30 days ago
- **drifting**: momentum decreased by 10+ points, or days since contact > cadence target by 50%
- **reactivated**: was drifting, then had a meaningful interaction in last 30 days

---

## Regenerating the Dashboard

After every add, update, log, or review — write a complete, self-contained `~/relationship-portfolio/dashboard.html`.

**Critical requirements:**
- Works by double-click — no server, no external CDN, no JS imports. Pure HTML + inline CSS + inline JS.
- All data (people, interactions, scores_history, config) embedded as JavaScript constants.
- All scores computed in-browser from embedded data using the scoring engine above.
- Multiple tabs: Overview, Priority Queue, People, Visualizations, Action Planner.
- Person detail panel shown when clicking a name (in-page, not a new page).
- Search + filter in People tab.
- Charts rendered as inline SVG.
- Graceful empty states when data is sparse.

After writing: `open ~/relationship-portfolio/dashboard.html`

---

## Dashboard HTML Template

Use the following as the complete template. Fill in the `/* INJECT_DATA */` section with actual data.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relationship Portfolio</title>
<style>
:root {
  --bg: #f1f5f9;
  --card: #ffffff;
  --header-bg: #0f172a;
  --header-text: #f8fafc;
  --text: #0f172a;
  --text-muted: #64748b;
  --text-xmuted: #94a3b8;
  --border: #e2e8f0;
  --accent: #6366f1;
  --accent-light: #eef2ff;
  --success: #10b981;
  --success-light: #d1fae5;
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --t1: #7c3aed;
  --t1-light: #ede9fe;
  --t2: #2563eb;
  --t2-light: #dbeafe;
  --t3: #0891b2;
  --t3-light: #cffafe;
  --t4: #6b7280;
  --t4-light: #f3f4f6;
  --radius: 10px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.5; }

/* HEADER */
.header { background: var(--header-bg); color: var(--header-text); padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-title { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
.header-subtitle { font-size: 12px; color: #94a3b8; }
.header-right { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #94a3b8; }
.health-badge { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; }

/* TABS */
.tabs { background: #ffffff; border-bottom: 1px solid var(--border); padding: 0 24px; display: flex; gap: 0; position: sticky; top: 56px; z-index: 99; }
.tab { padding: 12px 16px; font-size: 13px; font-weight: 500; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

/* MAIN */
.main { padding: 24px; max-width: 1200px; margin: 0 auto; }
.tab-content { display: none; }
.tab-content.active { display: block; }

/* CARDS */
.card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; }
.card-header { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

/* GRID */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

/* STAT CARDS */
.stat { text-align: center; padding: 20px 16px; }
.stat-value { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-sub { font-size: 11px; color: var(--text-xmuted); margin-top: 2px; }

/* BADGES */
.badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-t1 { background: var(--t1-light); color: var(--t1); }
.badge-t2 { background: var(--t2-light); color: var(--t2); }
.badge-t3 { background: var(--t3-light); color: var(--t3); }
.badge-t4 { background: var(--t4-light); color: var(--t4); }
.badge-drift { background: var(--danger-light); color: var(--danger); }
.badge-warm { background: var(--warning-light); color: #92400e; }
.badge-deep { background: var(--success-light); color: #065f46; }
.badge-seed { background: #f0fdf4; color: #166534; }
.badge-active { background: var(--accent-light); color: #3730a3; }
.badge-cat { background: #f8fafc; color: var(--text-muted); border: 1px solid var(--border); }

/* TREND LABELS */
.trend { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; }
.trend-strengthening { color: var(--success); }
.trend-stable { color: var(--text-muted); }
.trend-drifting { color: var(--danger); }
.trend-reactivated { color: var(--warning); }

/* SCORE RING */
.score-ring-wrap { display: flex; align-items: center; gap: 12px; }
.score-ring { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
.score-ring svg { transform: rotate(-90deg); }
.score-ring-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; }

/* SCORE BAR */
.score-bar-wrap { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.score-bar-label { width: 130px; font-size: 12px; color: var(--text-muted); flex-shrink: 0; }
.score-bar-track { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.score-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
.score-bar-val { width: 30px; text-align: right; font-size: 12px; font-weight: 600; color: var(--text); }

/* PRIORITY CARDS */
.priority-card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 20px; display: flex; align-items: flex-start; gap: 16px; transition: box-shadow 0.15s; cursor: pointer; }
.priority-card:hover { box-shadow: var(--shadow-md); }
.priority-rank { width: 28px; height: 28px; border-radius: 8px; background: var(--accent-light); color: var(--accent); font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.priority-body { flex: 1; min-width: 0; }
.priority-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
.priority-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.priority-action { font-size: 12px; color: var(--text); background: var(--bg); border-radius: 6px; padding: 6px 10px; margin-top: 6px; border-left: 3px solid var(--accent); }
.priority-right { text-align: right; flex-shrink: 0; }
.priority-days { font-size: 22px; font-weight: 800; line-height: 1; }
.priority-days-label { font-size: 10px; color: var(--text-xmuted); text-transform: uppercase; letter-spacing: 0.5px; }
.priority-score { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

/* PEOPLE TABLE */
.people-controls { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; outline: none; }
.search-input:focus { border-color: var(--accent); }
.filter-select { padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; background: white; cursor: pointer; outline: none; }
.people-table { width: 100%; border-collapse: collapse; }
.people-table th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border); }
.people-table td { padding: 11px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.people-table tr:hover td { background: #fafbfc; cursor: pointer; }
.people-table tr:last-child td { border-bottom: none; }
.person-name-cell { font-weight: 600; font-size: 14px; }
.person-sub { font-size: 11px; color: var(--text-muted); }

/* SECTION TITLE */
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.section-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }

/* PERSON DETAIL PANEL */
.detail-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
.detail-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 520px; background: white; z-index: 201; overflow-y: auto; box-shadow: -4px 0 24px rgba(0,0,0,0.12); padding: 28px; }
.detail-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 8px; background: var(--bg); border: none; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.detail-close:hover { background: var(--border); }
.detail-name { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.detail-role { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
.detail-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
.detail-section { margin-bottom: 20px; }
.detail-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-muted); margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border); }
.detail-note { font-size: 13px; color: var(--text); background: #fafbfc; border-radius: 8px; padding: 10px 12px; }
.memory-chip { display: inline-flex; align-items: center; gap: 5px; background: #fef9c3; color: #713f12; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 500; margin: 3px; }
.interaction-item { padding: 10px 0; border-bottom: 1px solid var(--border); }
.interaction-item:last-child { border-bottom: none; }
.interaction-date { font-size: 11px; color: var(--text-xmuted); }
.interaction-type-badge { font-size: 10px; font-weight: 600; background: var(--bg); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; color: var(--text-muted); }
.interaction-notes { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
.interaction-scores { font-size: 11px; color: var(--text-xmuted); margin-top: 2px; }

/* CHART CONTAINERS */
.chart-wrap { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; }
.chart-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.chart-desc { font-size: 11px; color: var(--text-muted); margin-bottom: 16px; }

/* ACTION PLANNER */
.planner-section { margin-bottom: 24px; }
.planner-section-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.planner-pill { display: inline-flex; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.planner-msg { background: var(--accent-light); color: var(--accent); }
.planner-hang { background: var(--success-light); color: #065f46; }
.planner-deep { background: #f0fdf4; color: #166534; }
.planner-re { background: var(--warning-light); color: #92400e; }
.planner-item { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 14px; cursor: pointer; transition: box-shadow 0.15s; }
.planner-item:hover { box-shadow: var(--shadow-md); }
.planner-item-num { width: 24px; height: 24px; border-radius: 6px; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.planner-item-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
.planner-item-action { font-size: 12px; color: var(--text-muted); }
.planner-item-channel { font-size: 11px; color: var(--text-xmuted); margin-top: 3px; }

/* ALERT BANNERS */
.alert-banner { border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; font-size: 12px; }
.alert-drift { background: var(--danger-light); color: #991b1b; border: 1px solid #fca5a5; }
.alert-pending { background: var(--warning-light); color: #92400e; border: 1px solid #fcd34d; }

/* OVERVIEW SCORE HISTORY */
.sparkline-wrap { margin-top: 8px; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: 1fr 1fr; }
  .detail-panel { width: 100%; }
}
@media (max-width: 640px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .main { padding: 16px; }
}
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    <div>
      <div class="header-title">Relationship Portfolio</div>
      <div class="header-subtitle" id="header-date"></div>
    </div>
  </div>
  <div class="header-right">
    <div>Portfolio Health</div>
    <div class="health-badge" id="health-score">—</div>
  </div>
</div>

<!-- TABS -->
<div class="tabs">
  <div class="tab active" data-tab="overview">Overview</div>
  <div class="tab" data-tab="priority">Priority Queue</div>
  <div class="tab" data-tab="people">People</div>
  <div class="tab" data-tab="visualizations">Visualizations</div>
  <div class="tab" data-tab="planner">Action Planner</div>
</div>

<!-- MAIN CONTENT -->
<div class="main">

  <!-- TAB: OVERVIEW -->
  <div class="tab-content active" id="tab-overview">
    <div id="overview-alerts" style="margin-bottom:16px;"></div>
    <div class="grid-4" id="overview-stats" style="margin-bottom:20px;"></div>
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-header">People by Tier</div>
        <div id="chart-tier-bar"></div>
      </div>
      <div class="card">
        <div class="card-header">Relationship Stages</div>
        <div id="chart-stage-bar"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">Recent Interactions (last 30 days)</div>
      <div id="recent-interactions-list"></div>
    </div>
  </div>

  <!-- TAB: PRIORITY QUEUE -->
  <div class="tab-content" id="tab-priority">
    <div class="section-title">Priority Queue</div>
    <div class="section-desc">Ranked by who deserves your attention most right now — blending relationship quality with how overdue you are.</div>
    <div id="priority-queue-list"></div>
  </div>

  <!-- TAB: PEOPLE -->
  <div class="tab-content" id="tab-people">
    <div class="section-title">People Directory</div>
    <div class="section-desc">All tracked relationships. Click any row to open their profile.</div>
    <div class="people-controls">
      <input type="text" class="search-input" id="people-search" placeholder="Search by name, city, company, tags...">
      <select class="filter-select" id="filter-tier">
        <option value="">All Tiers</option>
        <option value="Tier 1">Tier 1</option>
        <option value="Tier 2">Tier 2</option>
        <option value="Tier 3">Tier 3</option>
        <option value="Tier 4">Tier 4</option>
      </select>
      <select class="filter-select" id="filter-category">
        <option value="">All Categories</option>
        <option value="close_friend">Close Friend</option>
        <option value="friend">Friend</option>
        <option value="family">Family</option>
        <option value="dating">Dating</option>
        <option value="professional">Professional</option>
        <option value="mentor">Mentor</option>
        <option value="collaborator">Collaborator</option>
        <option value="acquaintance">Acquaintance</option>
        <option value="aspirational">Aspirational</option>
      </select>
      <select class="filter-select" id="filter-trend">
        <option value="">All Trends</option>
        <option value="strengthening">Strengthening</option>
        <option value="stable">Stable</option>
        <option value="drifting">Drifting</option>
        <option value="reactivated">Reactivated</option>
      </select>
    </div>
    <div class="card" style="padding:0;overflow:hidden;">
      <table class="people-table" id="people-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Tier</th>
            <th>Category</th>
            <th>Score</th>
            <th>Last Contact</th>
            <th>Trend</th>
            <th>Next Action</th>
            <th>City</th>
          </tr>
        </thead>
        <tbody id="people-tbody"></tbody>
      </table>
    </div>
  </div>

  <!-- TAB: VISUALIZATIONS -->
  <div class="tab-content" id="tab-visualizations">
    <div class="section-title">Relationship Insights</div>
    <div class="section-desc">Visual overview of your portfolio — closeness vs. strategic value, drift distribution, and more.</div>
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="chart-wrap">
        <div class="chart-title">Closeness vs. Strategic Value</div>
        <div class="chart-desc">Each dot is a person, colored by tier. Top-right = high on both dimensions.</div>
        <div id="chart-scatter"></div>
      </div>
      <div class="chart-wrap">
        <div class="chart-title">Energy vs. Reciprocity</div>
        <div class="chart-desc">Relationships in the top-right are both energizing and mutual.</div>
        <div id="chart-scatter-energy"></div>
      </div>
    </div>
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="chart-wrap">
        <div class="chart-title">Drift Risk Distribution</div>
        <div class="chart-desc">How many relationships are at each drift risk level.</div>
        <div id="chart-drift-dist"></div>
      </div>
      <div class="chart-wrap">
        <div class="chart-title">Days Since Last Contact</div>
        <div class="chart-desc">Recency heatmap across your portfolio.</div>
        <div id="chart-recency"></div>
      </div>
    </div>
    <div class="chart-wrap">
      <div class="chart-title">Rising vs Declining Relationships</div>
      <div class="chart-desc">Who has the most momentum right now, and who is drifting.</div>
      <div id="chart-momentum-bar"></div>
    </div>
  </div>

  <!-- TAB: ACTION PLANNER -->
  <div class="tab-content" id="tab-planner">
    <div class="section-title">This Week's Relationship Plan</div>
    <div class="section-desc">Specific, lightweight actions to keep your portfolio healthy.</div>
    <div id="planner-content"></div>
  </div>

</div>

<!-- PERSON DETAIL OVERLAY -->
<div class="detail-overlay" id="detail-overlay" onclick="closeDetail()"></div>
<div class="detail-panel" id="detail-panel" style="display:none;">
  <button class="detail-close" onclick="closeDetail()">✕</button>
  <div id="detail-content"></div>
</div>

<script>
// =============================================================
// EMBEDDED DATA — Claude fills this section on each regeneration
// =============================================================
const RAW_PEOPLE = /* INJECT_PEOPLE */[];
const RAW_INTERACTIONS = /* INJECT_INTERACTIONS */[];
const RAW_SCORE_HISTORY = /* INJECT_SCORES_HISTORY */[];
const CONFIG = /* INJECT_CONFIG */{};
const GENERATED_AT = "/* INJECT_DATE */";

// =============================================================
// SCORING ENGINE (see SKILL.md for full commentary)
// =============================================================
const TODAY = new Date();

function daysSince(dateStr) {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((TODAY - d) / 86400000));
}

function fmtDays(n) {
  if (n === 999) return 'Never';
  if (n === 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 7) return n + 'd ago';
  if (n < 30) return Math.round(n/7) + 'w ago';
  if (n < 365) return Math.round(n/30) + 'mo ago';
  return Math.round(n/365) + 'y ago';
}

function scoreColor(s) {
  if (s >= 75) return '#10b981';
  if (s >= 55) return '#6366f1';
  if (s >= 35) return '#f59e0b';
  return '#ef4444';
}

function computeCloseness(person, interactions, config) {
  const w = config.closeness_components || {};
  const intimacy = (person.closeness_score || 5) * 10;
  const trust = (person.trust_score || 5) * 10;
  const yearsKnown = person.relationship_start_year
    ? Math.min(TODAY.getFullYear() - person.relationship_start_year, config.history_years_cap || 12) : 0;
  const history = Math.min((yearsKnown / (config.history_years_cap || 12)) * 100, 100);
  const cutoff = new Date(TODAY); cutoff.setFullYear(cutoff.getFullYear() - 1);
  const inPersonTypes = ['coffee','dinner','event','party','trip'];
  const dm = config.interaction_type_depth_multiplier || {};
  let ipScore = 0;
  interactions.forEach(i => {
    if (new Date(i.date) >= cutoff && inPersonTypes.includes(i.interaction_type)) {
      ipScore += (i.interaction_quality_score/10) * (dm[i.interaction_type]||1.0) * 12;
    }
  });
  ipScore = Math.min(ipScore, 100);
  return (intimacy*(w.emotional_intimacy||0.35) + trust*(w.trust||0.30) + history*(w.history||0.20) + ipScore*(w.in_person_depth||0.15));
}

function computeMomentum(person, interactions, config) {
  const w = config.momentum_components || {};
  const tier = person.tier || 'Tier 3';
  const halfLife = ((config.momentum_half_life_days||{})[tier]) || 45;
  const dsc = daysSince(person.last_contact_date);
  const dsip = daysSince(person.last_seen_in_person_date);
  const recencyContact = 100 * Math.pow(0.5, dsc / halfLife);
  const recencyInPerson = 100 * Math.pow(0.5, dsip / (halfLife * 1.5));
  const recent = interactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
  const avgQ = recent.length ? (recent.reduce((s,i)=>s+(i.interaction_quality_score||5),0)/recent.length)*10 : 30;
  return (recencyContact*(w.recency_contact||0.50) + recencyInPerson*(w.recency_in_person||0.30) + avgQ*(w.interaction_quality_trend||0.20));
}

function computeStrategicValue(person, config) {
  const w = config.strategic_components || {};
  const ci = config.category_life_importance || {};
  const upside = (person.future_upside_score||5)*10;
  const support = (person.mutual_support_score||5)*10;
  const access = (person.access_score||5)*10;
  const lifeImp = ((ci[person.category]||0.5)*100);
  return (upside*(w.future_upside||0.35) + support*(w.mutual_support||0.30) + access*(w.access_ideas_opportunity||0.25) + lifeImp*(w.life_importance||0.10));
}

function computeEnergyReciprocity(person, interactions, config) {
  const w = config.energy_components || {};
  const energy = (person.energy_score||5)*10;
  const recip = (person.reciprocity_score||5)*10;
  const recent = interactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const avgQ = recent.length ? (recent.reduce((s,i)=>s+(i.interaction_quality_score||5),0)/recent.length)*10 : 50;
  return (energy*(w.energy_score||0.40) + recip*(w.reciprocity_score||0.40) + avgQ*(w.avg_interaction_quality||0.20));
}

function computeDriftRisk(person, interactions, config) {
  if (person.snoozed_until && new Date(person.snoozed_until) > TODAY) return 0;
  if (person.do_not_prioritize) return 0;
  const tier = person.tier || 'Tier 3';
  const tm = ((config.drift_risk_multipliers||{})[tier]) || 1.0;
  const cd = config.cadence_days || {};
  const tc = cd[tier] || {};
  const idealDays = tc[person.category] || tc.default || 60;
  const dsc = daysSince(person.last_contact_date);
  const overdue = Math.max(0, dsc - idealDays);
  return Math.min(100, (overdue / Math.max(idealDays,1)) * 50 * tm);
}

function computeOverallScore(c, m, s, e, config) {
  const w = config.scoring_weights || {};
  return (c*(w.closeness||0.30) + m*(w.momentum||0.25) + s*(w.strategic_value||0.20) + e*(w.energy_reciprocity||0.25));
}

function computeAutoTier(person, overall, config) {
  if (person.manual_tier_override) return person.manual_tier_override;
  const th = config.auto_tier_thresholds || {};
  const hvc = ['close_friend','family','dating'];
  const mvc = ['mentor','collaborator','friend'];
  if (overall >= ((th['Tier 1']||{}).min_overall_score||72)) return 'Tier 1';
  if (hvc.includes(person.category) && (person.closeness_score||0) >= 7) return 'Tier 1';
  if (overall >= ((th['Tier 2']||{}).min_overall_score||50)) return 'Tier 2';
  if (mvc.includes(person.category) && overall >= 40) return 'Tier 2';
  if (overall >= ((th['Tier 3']||{}).min_overall_score||28)) return 'Tier 3';
  return 'Tier 4';
}

function scoreOnePerson(person, allInteractions, config) {
  const myI = allInteractions.filter(i => i.person_id === person.id);
  const closeness = computeCloseness(person, myI, config);
  const momentum  = computeMomentum(person, myI, config);
  const strategic = computeStrategicValue(person, config);
  const energy    = computeEnergyReciprocity(person, myI, config);
  const driftRisk = computeDriftRisk(person, myI, config);
  const overall   = computeOverallScore(closeness, momentum, strategic, energy, config);
  const priority  = overall * 0.60 + driftRisk * 0.40;
  const tier      = computeAutoTier(person, overall, config);
  return { closeness, momentum, strategic, energy, driftRisk, overall, priority, tier,
    r: { closeness: Math.round(closeness), momentum: Math.round(momentum),
         strategic: Math.round(strategic), energy: Math.round(energy),
         driftRisk: Math.round(driftRisk), overall: Math.round(overall), priority: Math.round(priority) } };
}

function suggestAction(person, scores, allInteractions) {
  if (person.do_not_prioritize) return 'Not currently prioritized';
  if (person.snoozed_until && new Date(person.snoozed_until) > TODAY) return `Snoozed until ${person.snoozed_until}`;
  const myI = allInteractions.filter(i => i.person_id === person.id);
  const pending = myI.filter(i => i.followup_needed && i.followup_date).sort((a,b)=>new Date(a.followup_date)-new Date(b.followup_date))[0];
  if (pending && new Date(pending.followup_date) <= TODAY)
    return `Follow up: ${(pending.notes||'').slice(0,70)}`;
  const dsc = daysSince(person.last_contact_date);
  const dsip = daysSince(person.last_seen_in_person_date);
  const ch = person.preferred_channel || 'text';
  const nick = person.nickname || person.full_name.split(' ')[0];
  if (scores.r.driftRisk > 70 && scores.r.closeness > 60)
    return `Re-engage — ${dsc} days of silence. A direct invite or voice note would land well.`;
  if (dsip > 60 && ['Tier 1','Tier 2'].includes(scores.tier))
    return `Plan in-person — ${dsip} days since you last saw them. Suggest coffee or dinner.`;
  if (dsc > 14 && scores.tier === 'Tier 1') {
    const remind = (person.things_to_remember||'').split('.')[0];
    return `Send a quick ${ch==='call'?'call/voice note':ch}${remind?' — ask about '+remind.toLowerCase().slice(0,50):''}`;
  }
  if (dsc > 30 && scores.tier === 'Tier 2')
    return `Check in — ${dsc} days. A specific, direct message works well.`;
  if (scores.r.strategic > 65 && dsc > 45)
    return `Share something relevant to their interests or ask a specific question.`;
  if (person.relationship_stage === 'seed')
    return `Warm up — reply to something they've shared, or reference your last conversation.`;
  return `Stay warm — a lightweight touch this week would be good timing.`;
}

// =============================================================
// DATA PROCESSING
// =============================================================
const SCORED = RAW_PEOPLE.map(p => {
  const s = scoreOnePerson(p, RAW_INTERACTIONS, CONFIG);
  return { ...p, _scores: s, _tier: s.tier, _action: suggestAction(p, s, RAW_INTERACTIONS) };
}).sort((a,b) => b._scores.r.priority - a._scores.r.priority);

const AVG_HEALTH = SCORED.length
  ? Math.round(SCORED.reduce((s,p) => s+p._scores.r.overall, 0) / SCORED.length)
  : 0;

// =============================================================
// CHART HELPERS (SVG-based, no libraries)
// =============================================================
const TIER_COLORS = { 'Tier 1':'#7c3aed','Tier 2':'#2563eb','Tier 3':'#0891b2','Tier 4':'#6b7280' };
const CAT_LABELS = { close_friend:'Close Friend',friend:'Friend',family:'Family',dating:'Dating',professional:'Professional',mentor:'Mentor',collaborator:'Collaborator',acquaintance:'Acquaintance',aspirational:'Aspirational' };

function svgBar(data, {height=180, colorFn, title}={}) {
  if (!data.length) return '<p style="color:#94a3b8;font-size:12px;padding:8px;">No data</p>';
  const max = Math.max(...data.map(d=>d.value), 1);
  const bw = 44, gap = 14, pad = 32;
  const w = data.length*(bw+gap)+pad*2;
  const plotH = height-50;
  const bars = data.map((d,i)=>{
    const bh = Math.max(4, (d.value/max)*plotH);
    const x = pad + i*(bw+gap);
    const y = pad + plotH - bh;
    const color = colorFn ? colorFn(d) : '#6366f1';
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${color}" rx="5" opacity="0.85"/>
      <text x="${x+bw/2}" y="${y-5}" text-anchor="middle" font-size="11" font-weight="700" fill="${color}">${d.value}</text>
      <text x="${x+bw/2}" y="${height-8}" text-anchor="middle" font-size="10" fill="#94a3b8">${d.label}</text>`;
  }).join('');
  return `<svg width="100%" viewBox="0 0 ${w} ${height}" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
}

function svgScatter(data, {xLabel='',yLabel='',w=460,h=320}={}) {
  if (!data.length) return '<p style="color:#94a3b8;font-size:12px;padding:8px;">No data</p>';
  const pad = {t:20,r:20,b:40,l:40};
  const pw = w-pad.l-pad.r, ph = h-pad.t-pad.b;
  const dots = data.map(d=>{
    const cx = pad.l + (d.x/100)*pw;
    const cy = pad.t + ph - (d.y/100)*ph;
    const col = TIER_COLORS[d.tier]||'#6b7280';
    const name = (d.label||'').split(' ')[0];
    return `<circle cx="${cx}" cy="${cy}" r="7" fill="${col}" opacity="0.75" stroke="white" stroke-width="1.5">
      <title>${d.label}: x=${Math.round(d.x)}, y=${Math.round(d.y)}</title></circle>
      <text x="${cx+9}" y="${cy+4}" font-size="10" fill="#475569">${name}</text>`;
  }).join('');
  const xGrid = [0,25,50,75,100].map(v=>`<line x1="${pad.l+(v/100)*pw}" y1="${pad.t}" x2="${pad.l+(v/100)*pw}" y2="${pad.t+ph}" stroke="#f1f5f9" stroke-width="1"/>
    <text x="${pad.l+(v/100)*pw}" y="${h-4}" text-anchor="middle" font-size="9" fill="#cbd5e1">${v}</text>`).join('');
  const yGrid = [0,25,50,75,100].map(v=>`<line x1="${pad.l}" y1="${pad.t+ph-(v/100)*ph}" x2="${pad.l+pw}" y2="${pad.t+ph-(v/100)*ph}" stroke="#f1f5f9" stroke-width="1"/>
    <text x="${pad.l-4}" y="${pad.t+ph-(v/100)*ph+4}" text-anchor="end" font-size="9" fill="#cbd5e1">${v}</text>`).join('');
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    ${xGrid}${yGrid}${dots}
    <text x="${pad.l+pw/2}" y="${h-2}" text-anchor="middle" font-size="11" fill="#94a3b8">${xLabel}</text>
    <text x="10" y="${pad.t+ph/2}" text-anchor="middle" font-size="11" fill="#94a3b8" transform="rotate(-90,10,${pad.t+ph/2})">${yLabel}</text>
  </svg>`;
}

function svgHorizontalBar(data, {maxW=400,barH=20,colorFn}={}) {
  if (!data.length) return '<p style="color:#94a3b8;font-size:12px;padding:8px;">No data</p>';
  const max = Math.max(...data.map(d=>d.value),1);
  const labelW = 130, gap = 6, padL = 10, numW = 36;
  const totalH = data.length*(barH+gap)+10;
  const availW = maxW-labelW-numW-padL;
  const rows = data.map((d,i)=>{
    const bw = Math.max(4,(d.value/max)*availW);
    const y = i*(barH+gap);
    const col = colorFn ? colorFn(d) : '#6366f1';
    return `<text x="${padL+labelW-6}" y="${y+barH-5}" text-anchor="end" font-size="11" fill="#475569">${(d.label||'').slice(0,18)}</text>
      <rect x="${padL+labelW}" y="${y}" width="${bw}" height="${barH}" fill="${col}" rx="4" opacity="0.85"/>
      <text x="${padL+labelW+bw+5}" y="${y+barH-5}" font-size="11" font-weight="600" fill="${col}">${Math.round(d.value)}</text>`;
  }).join('');
  return `<svg width="100%" viewBox="0 0 ${maxW} ${totalH}" preserveAspectRatio="xMinYMid meet">${rows}</svg>`;
}

// =============================================================
// RENDER FUNCTIONS
// =============================================================
function scoreRing(score, size=52) {
  const r = (size-8)/2, cx = size/2, cy = size/2;
  const circ = 2*Math.PI*r;
  const filled = circ * (score/100);
  const col = scoreColor(score);
  return `<div class="score-ring" style="width:${size}px;height:${size}px;">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="5"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"
        stroke-dasharray="${filled} ${circ-filled}"/>
    </svg>
    <div class="score-ring-num" style="color:${col};font-size:${size>48?13:11}px">${score}</div>
  </div>`;
}

function scoreBar(label, value, color) {
  return `<div class="score-bar-wrap">
    <div class="score-bar-label">${label}</div>
    <div class="score-bar-track"><div class="score-bar-fill" style="width:${value}%;background:${color||scoreColor(value)};"></div></div>
    <div class="score-bar-val" style="color:${color||scoreColor(value)}">${Math.round(value)}</div>
  </div>`;
}

function tierBadge(tier) {
  const cl = {'Tier 1':'badge-t1','Tier 2':'badge-t2','Tier 3':'badge-t3','Tier 4':'badge-t4'};
  return `<span class="badge ${cl[tier]||'badge-t4'}">${tier||'—'}</span>`;
}

function stageBadge(stage) {
  const cl = {deep:'badge-deep',active:'badge-active',warm:'badge-warm',seed:'badge-seed',drifting:'badge-drift'};
  return `<span class="badge ${cl[stage]||'badge-cat'}">${stage||'—'}</span>`;
}

function trendHtml(trend) {
  const icons = {strengthening:'↑',stable:'→',drifting:'↓',reactivated:'↗'};
  return `<span class="trend trend-${trend||'stable'}">${icons[trend]||'→'} ${trend||'stable'}</span>`;
}

// --- OVERVIEW ---
function renderOverview() {
  document.getElementById('header-date').textContent = 'Updated ' + new Date(GENERATED_AT || Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  document.getElementById('health-score').textContent = AVG_HEALTH;
  document.getElementById('health-score').style.color = scoreColor(AVG_HEALTH);

  const drifting = SCORED.filter(p=>p._scores.r.driftRisk>55).length;
  const needsAction = SCORED.filter(p=>{
    const cd = CONFIG.cadence_days||{};
    const tc = cd[p._tier]||{};
    const ideal = tc[p.category]||tc.default||60;
    return daysSince(p.last_contact_date) > ideal;
  }).length;
  const t1=SCORED.filter(p=>p._tier==='Tier 1').length;
  const t2=SCORED.filter(p=>p._tier==='Tier 2').length;
  const t3=SCORED.filter(p=>p._tier==='Tier 3').length;
  const t4=SCORED.filter(p=>p._tier==='Tier 4').length;

  // Alerts
  const alerts = [];
  if (drifting > 0) alerts.push(`<div class="alert-banner alert-drift">⚠️ <strong>${drifting} relationship${drifting>1?'s':''}</strong> ${drifting>1?'are':'is'} at high drift risk — check the Priority Queue.</div>`);
  const pendingFollowups = RAW_INTERACTIONS.filter(i=>i.followup_needed&&i.followup_date&&new Date(i.followup_date)<=TODAY).length;
  if (pendingFollowups > 0) alerts.push(`<div class="alert-banner alert-pending">📌 <strong>${pendingFollowups} follow-up${pendingFollowups>1?'s':''}</strong> are overdue.</div>`);
  document.getElementById('overview-alerts').innerHTML = alerts.join('');

  // Stats
  const stats = [
    {v:SCORED.length, l:'People Tracked', s:'in your portfolio'},
    {v:AVG_HEALTH, l:'Portfolio Health', s:'avg relationship score', color:scoreColor(AVG_HEALTH)},
    {v:drifting, l:'Drifting', s:'need urgent attention', color:drifting>0?'#ef4444':'#10b981'},
    {v:needsAction, l:'Overdue', s:'past ideal cadence', color:needsAction>0?'#f59e0b':'#10b981'},
  ];
  document.getElementById('overview-stats').innerHTML = stats.map(s=>`
    <div class="card stat">
      <div class="stat-value" style="color:${s.color||'#0f172a'}">${s.v}</div>
      <div class="stat-label">${s.l}</div>
      <div class="stat-sub">${s.s}</div>
    </div>`).join('');

  // Tier bar
  document.getElementById('chart-tier-bar').innerHTML = svgBar(
    [{label:'T1',value:t1},{label:'T2',value:t2},{label:'T3',value:t3},{label:'T4',value:t4}],
    {height:160, colorFn:d=>TIER_COLORS['Tier '+d.label.slice(1)]||'#6b7280'}
  );

  // Stage bar
  const stages = ['deep','active','warm','seed','drifting'];
  const stageCounts = stages.map(s=>({label:s,value:SCORED.filter(p=>p.relationship_stage===s).length}));
  const stageColors = {deep:'#10b981',active:'#6366f1',warm:'#f59e0b',seed:'#0891b2',drifting:'#ef4444'};
  document.getElementById('chart-stage-bar').innerHTML = svgBar(stageCounts, {height:160, colorFn:d=>stageColors[d.label]||'#6b7280'});

  // Recent interactions
  const recent30 = RAW_INTERACTIONS.filter(i=>daysSince(i.date)<=30).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const el = document.getElementById('recent-interactions-list');
  if (!recent30.length) {
    el.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:8px 0;">No interactions logged in the last 30 days.</p>';
    return;
  }
  el.innerHTML = recent30.map(i=>{
    const p = RAW_PEOPLE.find(p=>p.id===i.person_id);
    const name = p ? p.full_name : i.person_id;
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9;cursor:pointer;" onclick="openDetail('${i.person_id}')">
      <span style="font-size:11px;color:#94a3b8;min-width:80px;">${i.date}</span>
      <span class="badge badge-cat" style="font-size:10px;">${i.interaction_type}</span>
      <span style="font-weight:600;font-size:13px;">${name}</span>
      <span style="flex:1;font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.notes||''}</span>
      <span style="font-size:12px;color:${scoreColor(i.interaction_quality_score*10)};font-weight:700;">Q:${i.interaction_quality_score}</span>
    </div>`;
  }).join('');
}

// --- PRIORITY QUEUE ---
function renderPriorityQueue() {
  const queue = SCORED.filter(p=>!p.do_not_prioritize).filter(p=>!p.snoozed_until||new Date(p.snoozed_until)<=TODAY);
  const el = document.getElementById('priority-queue-list');
  if (!queue.length) { el.innerHTML = '<p style="color:#94a3b8;font-size:13px;">No one to prioritize yet — add some people first.</p>'; return; }
  el.innerHTML = queue.map((p,i)=>`
    <div class="priority-card" onclick="openDetail('${p.id}')" style="margin-bottom:10px;">
      <div class="priority-rank">${i+1}</div>
      <div class="priority-body">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span class="priority-name">${p.full_name}</span>
          ${tierBadge(p._tier)}
          ${stageBadge(p.relationship_stage)}
          ${trendHtml(p.health_trend)}
        </div>
        <div class="priority-meta">${p.role||''}${p.company?' · '+p.company:''}${p.city?' · '+p.city:''}</div>
        <div class="priority-action">💬 ${p._action}</div>
      </div>
      <div class="priority-right">
        ${scoreRing(p._scores.r.overall)}
        <div style="margin-top:6px;text-align:center;">
          <div class="priority-days" style="color:${p._scores.r.driftRisk>60?'#ef4444':p._scores.r.driftRisk>30?'#f59e0b':'#10b981'}">${daysSince(p.last_contact_date)===999?'—':daysSince(p.last_contact_date)}</div>
          <div class="priority-days-label">days ago</div>
          <div class="priority-score">Priority: ${p._scores.r.priority}</div>
        </div>
      </div>
    </div>`).join('');
}

// --- PEOPLE DIRECTORY ---
function renderPeopleTable(people) {
  const tbody = document.getElementById('people-tbody');
  tbody.innerHTML = people.map(p=>`
    <tr onclick="openDetail('${p.id}')">
      <td>
        <div class="person-name-cell">${p.full_name}</div>
        <div class="person-sub">${p.role||''}${p.company?' @ '+p.company:''}</div>
      </td>
      <td>${tierBadge(p._tier)}</td>
      <td><span class="badge badge-cat">${(CAT_LABELS[p.category]||p.category||'—')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          ${scoreRing(p._scores.r.overall, 38)}
          <span style="font-size:11px;color:${scoreColor(p._scores.r.driftRisk)}">${p._scores.r.driftRisk>0?'↓'+p._scores.r.driftRisk+' drift':''}</span>
        </div>
      </td>
      <td style="font-size:12px;color:#64748b;">${fmtDays(daysSince(p.last_contact_date))}</td>
      <td>${trendHtml(p.health_trend)}</td>
      <td style="font-size:12px;color:#475569;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p._action}</td>
      <td style="font-size:12px;color:#94a3b8;">${p.city||'—'}</td>
    </tr>`).join('');
}

function renderPeople() {
  renderPeopleTable(SCORED);
  function applyFilters() {
    const q = document.getElementById('people-search').value.toLowerCase();
    const tier = document.getElementById('filter-tier').value;
    const cat = document.getElementById('filter-category').value;
    const trend = document.getElementById('filter-trend').value;
    const filtered = SCORED.filter(p=>{
      const txt = [p.full_name,p.city,p.company,p.role,...(p.tags||[])].join(' ').toLowerCase();
      return (!q||txt.includes(q)) && (!tier||p._tier===tier) && (!cat||p.category===cat) && (!trend||p.health_trend===trend);
    });
    renderPeopleTable(filtered);
  }
  document.getElementById('people-search').oninput = applyFilters;
  document.getElementById('filter-tier').onchange = applyFilters;
  document.getElementById('filter-category').onchange = applyFilters;
  document.getElementById('filter-trend').onchange = applyFilters;
}

// --- VISUALIZATIONS ---
function renderVisualizations() {
  // Scatter: Closeness vs Strategic
  document.getElementById('chart-scatter').innerHTML = svgScatter(
    SCORED.map(p=>({x:p._scores.r.closeness,y:p._scores.r.strategic,label:p.full_name,tier:p._tier})),
    {xLabel:'Closeness',yLabel:'Strategic Value'}
  );
  // Scatter: Energy vs Reciprocity
  document.getElementById('chart-scatter-energy').innerHTML = svgScatter(
    SCORED.map(p=>({x:(p.energy_score||5)*10,y:(p.reciprocity_score||5)*10,label:p.full_name,tier:p._tier})),
    {xLabel:'Energy',yLabel:'Reciprocity'}
  );
  // Drift distribution
  const driftBuckets = [{label:'Low\n0-25',value:0},{label:'Med\n25-55',value:0},{label:'High\n55-80',value:0},{label:'Crit\n80+',value:0}];
  SCORED.forEach(p=>{
    const r=p._scores.r.driftRisk;
    if(r<25)driftBuckets[0].value++;
    else if(r<55)driftBuckets[1].value++;
    else if(r<80)driftBuckets[2].value++;
    else driftBuckets[3].value++;
  });
  document.getElementById('chart-drift-dist').innerHTML = svgBar(driftBuckets,{height:160,colorFn:d=>['#10b981','#f59e0b','#ef4444','#7f1d1d'][driftBuckets.indexOf(d)]||'#6b7280'});
  // Recency heatmap (horizontal bar)
  const sorted = [...SCORED].sort((a,b)=>daysSince(a.last_contact_date)-daysSince(b.last_contact_date));
  document.getElementById('chart-recency').innerHTML = svgHorizontalBar(
    sorted.map(p=>({label:p.full_name,value:daysSince(p.last_contact_date)===999?0:daysSince(p.last_contact_date)})),
    {maxW:460,barH:18,colorFn:d=>{const v=d.value;return v<14?'#10b981':v<45?'#f59e0b':v<90?'#ef4444':'#7f1d1d';}}
  );
  // Momentum bar
  const byMomentum = [...SCORED].sort((a,b)=>b._scores.r.momentum-a._scores.r.momentum);
  document.getElementById('chart-momentum-bar').innerHTML = svgHorizontalBar(
    byMomentum.map(p=>({label:p.full_name,value:p._scores.r.momentum})),
    {maxW:700,barH:20,colorFn:d=>scoreColor(d.value)}
  );
}

// --- ACTION PLANNER ---
function renderPlanner() {
  const recs = generateRecommendations(SCORED, RAW_INTERACTIONS, CONFIG);
  const el = document.getElementById('planner-content');

  function planSection(title, pill, pillCls, items, numCls, numBg, emptyMsg) {
    if (!items.length) return `<div class="planner-section"><div class="planner-section-title"><span class="planner-pill ${pillCls}">${pill}</span> ${title}</div><p style="color:#94a3b8;font-size:13px;">${emptyMsg}</p></div>`;
    return `<div class="planner-section">
      <div class="planner-section-title"><span class="planner-pill ${pillCls}">${pill}</span> ${title}</div>
      ${items.map((x,i)=>`
        <div class="planner-item" onclick="openDetail('${x.person.id}')">
          <div class="planner-item-num" style="background:${numBg};color:white;">${i+1}</div>
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
              <div class="planner-item-name">${x.person.full_name}</div>
              ${tierBadge(x.scores.tier)}
            </div>
            <div class="planner-item-action">${x.person._action}</div>
            <div class="planner-item-channel">via ${x.person.preferred_channel||'text'} · ${fmtDays(x.daysSinceContact)}</div>
          </div>
        </div>`).join('')}
    </div>`;
  }

  el.innerHTML = [
    planSection('Message This Week','✉ Message','planner-msg',recs.messageQueue,'msg-num','#6366f1','You\'re all caught up on messages — nice work.'),
    planSection('Schedule a Hangout','☕ In-Person','planner-hang',recs.hangoutQueue,'hang-num','#10b981','No urgent in-person meetings needed right now.'),
    planSection('Deepen This Relationship','↗ Deepen','planner-deep',recs.deepenQueue,'deep-num','#0891b2','No deepening targets right now.'),
    planSection('Re-engage','⟳ Re-engage','planner-re',recs.reengageQueue,'re-num','#f59e0b','No re-engagement needed right now.'),
    recs.driftingAlerts.length ? `<div class="planner-section">
      <div class="planner-section-title" style="color:#ef4444;">⚠️ Drifting Alerts</div>
      ${recs.driftingAlerts.map(x=>`<div class="alert-banner alert-drift" style="cursor:pointer;" onclick="openDetail('${x.person.id}')">
        <strong>${x.person.full_name}</strong> (${x.scores.tier}) — drift risk ${x.scores.r.driftRisk}/100 · ${fmtDays(x.daysSinceContact)}
      </div>`).join('')}
    </div>` : '',
  ].join('');
}

// =============================================================
// RECOMMENDATION ENGINE
// =============================================================
function generateRecommendations(people, interactions, config) {
  const rcfg = config.recommendations||{};
  const scored = people.filter(p=>!p.do_not_prioritize).filter(p=>!p.snoozed_until||new Date(p.snoozed_until)<=TODAY)
    .map(p=>{
      const cd = config.cadence_days||{};
      const tc = cd[p._tier]||{};
      const idealDays = tc[p.category]||tc.default||60;
      const dsc = daysSince(p.last_contact_date);
      return {person:p, scores:p._scores, daysOverdue:Math.max(0,dsc-idealDays), daysSinceContact:dsc, idealDays};
    }).sort((a,b)=>b.scores.r.priority-a.scores.r.priority);
  return {
    messageQueue: scored.filter(x=>x.daysOverdue>0&&x.scores.r.overall>35).slice(0,rcfg.message_this_week||5),
    hangoutQueue: scored.filter(x=>['Tier 1','Tier 2'].includes(x.scores.tier)&&daysSince(x.person.last_seen_in_person_date)>45).slice(0,rcfg.schedule_hangout||2),
    deepenQueue: scored.filter(x=>x.scores.r.strategic>60&&x.scores.r.closeness>40&&x.person.relationship_stage!=='deep').slice(0,rcfg.deepen||1),
    reengageQueue: scored.filter(x=>x.scores.r.closeness>60&&x.scores.r.momentum<35).slice(0,rcfg.reengage||1),
    driftingAlerts: [...scored].filter(x=>x.scores.r.driftRisk>55).sort((a,b)=>b.scores.r.driftRisk-a.scores.r.driftRisk).slice(0,5),
    fullQueue: scored,
  };
}

// --- PERSON DETAIL ---
function openDetail(personId) {
  const p = SCORED.find(x=>x.id===personId);
  if (!p) return;
  const s = p._scores;
  const myI = RAW_INTERACTIONS.filter(i=>i.person_id===personId).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const hist = RAW_SCORE_HISTORY.filter(h=>h.person_id===personId).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  const ch = p.preferred_channel||'text';

  const memories = (p.things_to_remember||'').split('.').map(s=>s.trim()).filter(Boolean);
  const interests = (p.interests||[]).slice(0,6);

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-name">${p.full_name}${p.nickname&&p.nickname!==p.full_name.split(' ')[0]?' ('+p.nickname+')':''}</div>
    <div class="detail-role">${p.role||''}${p.company?' · '+p.company:''}${p.city?' · '+p.city:''}</div>
    <div class="detail-badges">
      ${tierBadge(p._tier)} ${stageBadge(p.relationship_stage)} ${trendHtml(p.health_trend)}
      <span class="badge badge-cat">${CAT_LABELS[p.category]||p.category}</span>
      <span class="badge badge-cat">via ${ch}</span>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Relationship Scores</div>
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
        ${scoreRing(s.r.overall, 60)}
        <div style="flex:1;">
          <div style="font-size:20px;font-weight:800;color:${scoreColor(s.r.overall)}">${s.r.overall}<span style="font-size:12px;font-weight:400;color:#94a3b8;">/100 overall</span></div>
          <div style="font-size:11px;color:#64748b;">Priority score: ${s.r.priority} · Drift risk: ${s.r.driftRisk}</div>
        </div>
      </div>
      ${scoreBar('Closeness', s.r.closeness)}
      ${scoreBar('Momentum', s.r.momentum)}
      ${scoreBar('Strategic Value', s.r.strategic)}
      ${scoreBar('Energy / Reciprocity', s.r.energy)}
      <div class="score-bar-wrap" style="margin-top:8px;">
        <div class="score-bar-label" style="color:#ef4444;">Drift Risk</div>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${s.r.driftRisk}%;background:#ef4444;"></div></div>
        <div class="score-bar-val" style="color:#ef4444;">${s.r.driftRisk}</div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Suggested Next Touch</div>
      <div class="detail-note" style="border-left:3px solid #6366f1;">💬 ${p._action}</div>
    </div>

    ${memories.length ? `<div class="detail-section">
      <div class="detail-section-title">Things to Remember</div>
      <div>${memories.map(m=>`<span class="memory-chip">💡 ${m}</span>`).join('')}</div>
    </div>` : ''}

    ${interests.length ? `<div class="detail-section">
      <div class="detail-section-title">Interests</div>
      <div>${interests.map(i=>`<span class="badge badge-cat" style="margin:2px;">${i}</span>`).join('')}</div>
    </div>` : ''}

    ${p.notes_about_them ? `<div class="detail-section">
      <div class="detail-section-title">Notes</div>
      <div class="detail-note">${p.notes_about_them}</div>
    </div>` : ''}

    ${p.relationship_goals ? `<div class="detail-section">
      <div class="detail-section-title">Relationship Goals</div>
      <div class="detail-note">${p.relationship_goals}</div>
    </div>` : ''}

    <div class="detail-section">
      <div class="detail-section-title">Profile Details</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:12px;">
        <div style="color:#94a3b8;">Met</div><div>${p.where_we_met||'—'}</div>
        <div style="color:#94a3b8;">Last contact</div><div>${p.last_contact_date||'—'} (${fmtDays(daysSince(p.last_contact_date))})</div>
        <div style="color:#94a3b8;">Last in person</div><div>${p.last_seen_in_person_date||'—'} (${fmtDays(daysSince(p.last_seen_in_person_date))})</div>
        <div style="color:#94a3b8;">Known since</div><div>${p.relationship_start_year||'—'}</div>
        <div style="color:#94a3b8;">Cadence target</div><div>${p.interaction_frequency_target||'—'}</div>
      </div>
    </div>

    ${(p.tags||[]).length ? `<div class="detail-section">
      <div class="detail-section-title">Tags</div>
      <div>${p.tags.map(t=>`<span class="badge badge-cat" style="margin:2px;font-size:10px;">#${t}</span>`).join('')}</div>
    </div>` : ''}

    <div class="detail-section">
      <div class="detail-section-title">Interaction History (${myI.length})</div>
      ${myI.length ? myI.slice(0,10).map(i=>`
        <div class="interaction-item">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
            <span class="interaction-date">${i.date}</span>
            <span class="interaction-type-badge">${i.interaction_type}</span>
            <span style="font-size:10px;color:#94a3b8;">${i.initiated_by==='me'?'I reached out':i.initiated_by==='them'?'They reached out':'Mutual / event'}</span>
          </div>
          ${i.notes ? `<div class="interaction-notes">${i.notes}</div>` : ''}
          <div class="interaction-scores">Quality: ${i.interaction_quality_score}/10 · Depth: ${i.interaction_depth_score}/10
            ${i.followup_needed&&i.followup_date?`<span style="color:#f59e0b;margin-left:8px;">📌 Follow-up: ${i.followup_date}</span>`:''}
          </div>
        </div>`).join('') : '<p style="color:#94a3b8;font-size:12px;">No interactions logged yet.</p>'}
    </div>

    ${hist.length > 1 ? `<div class="detail-section">
      <div class="detail-section-title">Score History</div>
      <div style="overflow-x:auto;">${svgScoreHistory(hist)}</div>
    </div>` : ''}
  `;

  document.getElementById('detail-overlay').style.display = 'block';
  document.getElementById('detail-panel').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function svgScoreHistory(hist) {
  if (hist.length < 2) return '';
  const w=400, h=100, pad=30;
  const scores = hist.map(h=>h.overall_score);
  const maxS = Math.max(...scores, 100);
  const points = hist.map((h,i)=>{
    const x = pad + (i/(hist.length-1))*(w-pad*2);
    const y = pad + (1-h.overall_score/maxS)*(h-pad*2);
    return {x,y,score:h.overall_score,date:h.timestamp?.slice(0,10)||''};
  });
  const path = points.map((p,i)=>(i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`)).join(' ');
  const dots = points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#6366f1"><title>${p.date}: ${p.score}</title></circle>`).join('');
  return `<svg width="100%" viewBox="0 0 ${w} ${h}">
    <path d="${path}" fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"/>
    ${dots}
    <text x="${pad}" y="${h-4}" font-size="9" fill="#94a3b8">${hist[0].timestamp?.slice(0,10)||''}</text>
    <text x="${w-pad}" y="${h-4}" text-anchor="end" font-size="9" fill="#94a3b8">${hist[hist.length-1].timestamp?.slice(0,10)||''}</text>
  </svg>`;
}

function closeDetail() {
  document.getElementById('detail-overlay').style.display = 'none';
  document.getElementById('detail-panel').style.display = 'none';
  document.body.style.overflow = '';
}

// =============================================================
// NAVIGATION
// =============================================================
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-'+tab.dataset.tab).classList.add('active');
  });
});

// =============================================================
// INIT
// =============================================================
renderOverview();
renderPriorityQueue();
renderPeople();
renderVisualizations();
renderPlanner();
</script>
</body>
</html>
```

---

## Data Injection Instructions

When generating the dashboard, replace the placeholder comments in the `<script>` block:

```
/* INJECT_PEOPLE */      → JSON array from people.json (the "people" array)
/* INJECT_INTERACTIONS */→ JSON array from interactions.json (the "interactions" array)
/* INJECT_SCORES_HISTORY */→ JSON array from scores_history.json (the "snapshots" array)
/* INJECT_CONFIG */      → full object from config.json
/* INJECT_DATE */        → today's date as ISO string, e.g. 2026-04-02
```

Example injection:
```javascript
const RAW_PEOPLE = [{"id":"alex-chen","full_name":"Alex Chen",...}];
const RAW_INTERACTIONS = [{"id":"i001","person_id":"alex-chen",...}];
const RAW_SCORE_HISTORY = [];
const CONFIG = {"scoring_weights":{"closeness":0.30,...},...};
const GENERATED_AT = "2026-04-02";
```

---

## Setup Questionnaire

When user says "set up" or invokes with no data, ask 2-3 questions at a time in a warm, conversational tone:

**Round 1:**
> "Let's set up your relationship portfolio. I'll ask you a few quick questions to personalize how your relationships get scored and prioritized.
>
> First — what relationship categories matter most to you *right now*? For example: close friends, dating, mentors, professional network, collaborators, family?"

**Round 2 (after they answer):**
> "Got it. And what's your biggest relationship challenge right now — is it more that important relationships are drifting, that you're not deepening the right ones, or that you're not sure who to prioritize?"
>
> "How often do you ideally want to be in touch with your closest people — weekly, every couple weeks, monthly?"

**Round 3:**
> "Last question: when you think about 'high upside' in a relationship — what does that mean to you? Ideas and inspiration? Career opportunities? Emotional support? Creative collaboration?"

Then generate `config.json` based on answers and summarize the weights you've set.

---

## Example Seed Data

On first setup, offer to import from `~/Desktop/relationship-portfolio-mgmt/seed_data.json` as demo data, or start fresh.

Copy seed to `~/relationship-portfolio/people.json` and `~/relationship-portfolio/interactions.json` (extracted from the top-level arrays in seed_data.json).

---

## File: config.json Template

If no config exists, copy from `~/Desktop/relationship-portfolio-mgmt/config.default.json`.

---

## Notes

- **Score editing:** All scoring weights are in `~/relationship-portfolio/config.json`. Edit the `scoring_weights`, `closeness_components`, `momentum_components`, `energy_components`, and `strategic_components` sections.
- **Cadence editing:** Edit `cadence_days` in config.json. Each tier has category-specific and default cadence in days.
- **Tier editing:** Manually set `manual_tier_override` on any person to override auto-tiering. Set to `null` to use auto-tier.
- **Snoozing:** Set `snoozed_until` to a future date to hide someone from recommendations temporarily.
- **Low priority:** Set `do_not_prioritize: true` to remove someone from all recommendation queues.
- After every change, always regenerate the dashboard and open it with `open ~/relationship-portfolio/dashboard.html`.

# InfluenceCoach

Internal tool for a **Director of Ecommerce & Performance Marketing** to turn the company org chart into a practical influence and stakeholder coaching system.

Not an org-chart viewer — a daily coach that answers:
- Who do I need to influence right now?
- What do I need from them across 1m / 3m / 12m?
- What do I offer them back?
- How should I frame the ask?
- If they're in the office today, what do I say?

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (shared `agency-coach` project) — `influence_*` tables
- **Anthropic SDK** (Claude Sonnet 4 primary, Haiku 4.5 fallback, vision for org-chart extraction)
- Deployable to **Vercel**

## Features

| Screen | What it does |
| --- | --- |
| `/` Dashboard | Top priority stakeholders, who's in office, blocked asks, recent AI recs |
| `/stakeholders` | Ranked table with influence / relationship / 1m ask / status / priority score |
| `/stakeholders/[id]` | 6 tabs: Profile · What I Need · What They Can Help With · Reverse Value · Influence Coaching · In-Person |
| `/reverse` | Flipped view — what I can do for each stakeholder |
| `/in-person` | Toggle who's in office, get ranked conversation plan with talking points, nudges, follow-ups |
| `/upload` | Screenshot or image of an org chart → Claude vision extracts name/title/team → editable list → save |

AI output is structured JSON, persisted in `influence_ai_insights`. All Claude calls have a text stub fallback so the app is usable without a key (flagged visibly).

## Scoring model

`priorityScore = influence × goalPriority × relationshipWeight × blockerBoost × statusBoost`

- `relationshipWeight`: cold 0.6 · neutral 0.9 · aligned 1.15 · sponsor 1.35
- `blockerBoost`: 1.2 if a blocker is logged
- `statusBoost`: 1.3 if status is blocked
- No goals on file → influence-only

## Setup

```bash
cd influence-coach
npm install
cp .env.example .env.local
# fill in the three real keys
npm run dev
```

Open http://localhost:3000.

First run: click **Seed example stakeholders** on the dashboard to load the 5 example rows (CRO, CEO/CFO, Behnoush, Lindsey, VP Ops) with goals and reverse-value pre-filled.

## Environment variables

| Var | Where | What |
| --- | --- | --- |
| `INFLUENCE_COACH_ANTHROPIC_KEY` | server only | Anthropic API key. Without it, AI endpoints return stubs. |
| `NEXT_PUBLIC_SUPABASE_URL` | client-safe | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client-safe | Supabase anon key (RLS-gated). |
| `NEXT_PUBLIC_MY_ROLE` | optional | Your job title — anchors every AI prompt. Default: "Director of Ecommerce and Performance Marketing". |
| `NEXT_PUBLIC_MY_NAME` | optional | Default: "Michael". |

## Supabase

Uses the existing `agency-coach` project. Migration `influence_coach_schema` creates:

- `influence_stakeholders`
- `influence_stakeholder_goals` (1:1 with stakeholder)
- `influence_reverse_value` (1:1 with stakeholder)
- `influence_ai_insights` (1:many, newest-first)
- `influence_org_chart_uploads`
- `influence_interaction_log`

RLS is off to match the existing `agency-coach` convention (single-user internal tool). Add RLS policies before multi-tenant use.

## Deploying to Vercel

```bash
# one-time
vercel link

# every deploy
vercel --prod
```

Set the three env vars in the Vercel project settings (Environment Variables):
- `INFLUENCE_COACH_ANTHROPIC_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Node runtime is fine for all routes; `/api/org-chart/parse` pins `runtime = "nodejs"` because it handles multipart uploads.

## Local dev notes

- Supabase client only reads from the env — no server-side secrets are shipped to the browser.
- Image uploads for org charts are stored as base64 data URLs in Postgres. For scale, swap `createUpload` to Supabase Storage.
- All AI routes return `{ mock: true }` if no Anthropic key is set — the UI flags this.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

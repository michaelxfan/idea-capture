# Dual Intent OS

A second brain for what you say you want, what you actually optimize for under pressure, and when that switch happens.

Not a task manager. An interpreter. You drop a situation in under twenty seconds; the app returns your likely A intention, your likely B intention, the threshold condition that flips one into the other, and one concrete next action.

## Stack

- **Next.js 14** (App Router, TypeScript, Server Components)
- **Tailwind CSS** — calm neutral design system
- **Supabase** — auth (magic link), Postgres, RLS
- **Anthropic Claude** — default AI provider, swappable in `src/lib/ai/provider.ts`
- **Zod** — input + AI output validation

## Local setup

```bash
# 1. install
npm install

# 2. env
cp .env.local.example .env.local
# fill in Supabase + Anthropic keys

# 3. database
# In the Supabase SQL editor, run supabase/migrations/0001_init.sql

# 4. dev
npm run dev
```

Open <http://localhost:3000>, sign in with a magic link, then go to `/capture`.

### Seed demo data (optional)

```bash
DEMO_USER_ID=<your-auth-uid> \
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run seed
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import into Vercel.
3. Set the environment variables from `.env.local.example` in the Vercel project settings.
4. Deploy. The `interpret` route runs on the Node runtime (required for the Anthropic SDK).
5. In Supabase → Authentication → URL Configuration, add your Vercel domain to the allowed redirect URLs (`https://<your-app>.vercel.app/auth/callback`).

## Architecture

```
src/
  app/
    page.tsx                 landing
    (auth)/login/            magic-link sign in
    auth/callback/           OAuth code exchange
    dashboard/               "Today's likely splits"
    capture/                 new capture screen
    patterns/                aggregate patterns
    review/                  history, filters, outcome tagging
    api/
      interpret/             POST — saves capture + runs AI
      captures/[id]/         PATCH/DELETE individual captures
  components/                AppShell, CaptureForm, InterpretationCard, …
  lib/
    ai/
      schema.ts              Zod schemas for input + interpretation
      prompt.ts              system + user prompts
      provider.ts            Anthropic implementation, swappable
    supabase/                browser, server, middleware clients
  types/                     shared domain types
supabase/migrations/0001_init.sql
scripts/seed.ts
```

### Swapping the AI provider

`src/lib/ai/provider.ts` exposes a single function:

```ts
export async function interpretCapture(input: CaptureInput): Promise<Interpretation>
```

To swap providers, replace that function's body with your implementation. The prompt, schema, and response-parsing layer live in sibling files and are provider-agnostic.

## Product notes

- **A is not morally better than B.** The app refuses to moralize and classifies B as `strategic`, `protective`, `avoidant`, `healthy`, `mixed`, or `unclear`.
- **Thresholds are conditions, not clocks.** "When the email requires an emotional decision" is the right shape; "after 10 minutes" is not.
- **Every interpretation ends with one concrete next action** plus a *minimum viable A* — a scaled-down version of the ideal that's actually doable right now.
- **Patterns** uses simple aggregation in v1 (counts, normalized text matching). `TODO` markers note where embedding-based clustering would slot in later.

## Security

- Row Level Security is enabled on all user tables. Policies restrict every table to `auth.uid() = user_id`.
- The `SUPABASE_SERVICE_ROLE_KEY` is only used in the seed script — not in any app route.
- Protected routes (`/dashboard`, `/capture`, `/patterns`, `/review`) are gated in middleware.

# 2026 Big Rock Ideas: Q2 — Greenhouse Dashboard

A single-user strategic communication dashboard for Greenhouse's Q2 big rocks.
Built on Next.js 14 + Supabase, designed to deploy on Vercel.

This is the app version of `greenhouse-q2-big-rocks.html` — same visual design,
now backed by a database so milestone progress can be tracked over time.

## What you can edit

- Big rock titles and descriptions (click to edit)
- Tactics — edit, add (+ button), remove (× on hover)
- Milestones — edit name/date, add, remove
- **Milestone status** — click the colored dot to cycle
  `upcoming → in-progress → completed → upcoming`
- Header title, subtitle, strategic phrase, footer note

**Progress bars auto-calculate** from milestone status:
`(completed + 0.5 × in-progress) / total`. In-progress milestones count as
half so the bar reflects work in motion, not just what's shipped.

The three top-of-band channel targets ($547K / $923K / $473K) are stored as
JSON on the `config` row — edit them directly in Supabase if you need to change
them. Everything else is editable in the UI.

---

## One-time setup

### 1. Supabase — run the migration

Open your Supabase project → **SQL Editor** → **New query**.
Paste the contents of `supabase/migrations/0001_init.sql` and run it.

This creates the tables (`config`, `big_rocks`, `tactics`, `milestones`),
enables RLS so only authenticated users can read/write, and seeds the
dashboard with the Q2 big rocks from the original HTML.

### 2. Supabase — create your user

Since this is single-user, there's no signup flow. Create your account manually:

**Authentication → Users → Add user → Create new user**
- Enter your email + a password
- Check "Auto Confirm User" so you can sign in immediately

### 3. Get your environment variables

**Project Settings → API** — copy these two values:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Local setup

```bash
cd greenhouse-q2-app
cp .env.example .env.local
# Paste the two values from step 3 into .env.local
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.
Sign in with the credentials from step 2.

---

## Deploying to Vercel

1. Push this folder to a GitHub repo (private is fine).
2. In Vercel → **Add New Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. **Environment Variables** — add the same two vars from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

That's it. The same Supabase project is used for local + production.

---

## Architecture at a glance

```
app/
  page.tsx          → server component, fetches config+rocks+tactics+milestones
  layout.tsx        → root layout, loads globals.css
  globals.css       → design system (ported from the HTML)
  actions.ts        → all server actions (auth-gated mutations)
  login/page.tsx    → email/password sign in
  logout/route.ts   → POST → sign out → redirect

components/
  Dashboard.tsx     → client component with click-to-edit + status cycling

lib/supabase/
  server.ts         → server client (reads cookies)
  client.ts         → browser client
  middleware.ts     → session refresh + redirect gate

middleware.ts       → redirects unauth'd users to /login

supabase/migrations/
  0001_init.sql     → schema + RLS + seed data
```

**Auth model**: `middleware.ts` checks every request. No session → redirect to
`/login`. RLS on every table blocks anon access at the database layer too —
even if something bypasses the middleware, the data stays locked.

**Mutations**: all writes go through server actions in `app/actions.ts`, which
re-validate the user before touching the DB. Each action calls
`revalidatePath('/')` so the UI reflects the new state immediately.

---

## Changing the seed data later

The migration is idempotent (it only seeds if `big_rocks` is empty). If you
want to reset the dashboard to seed state:

```sql
truncate big_rocks cascade;
truncate config;
-- then re-run 0001_init.sql
```

Careful — that wipes any edits you've made.

-- ══════════════════════════════════════════════════════════════
--  Greenhouse Q2 Big Rocks — Schema + Seed
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Tables ────────────────────────────────────────────────────

create table if not exists config (
  id int primary key default 1,
  title text not null,
  subtitle text not null,
  note text not null,
  revenue_target text not null,
  strategic_phrase text not null,
  channels jsonb not null default '[]'::jsonb,
  footer text not null,
  updated_at timestamptz not null default now(),
  constraint config_singleton check (id = 1)
);

create table if not exists big_rocks (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  title text not null,
  description text not null,
  channel_targets jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tactics (
  id uuid primary key default gen_random_uuid(),
  big_rock_id uuid not null references big_rocks(id) on delete cascade,
  position int not null,
  text text not null
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  big_rock_id uuid not null references big_rocks(id) on delete cascade,
  position int not null,
  name text not null,
  date text not null,
  status text not null check (status in ('upcoming','in-progress','completed'))
);

create index if not exists tactics_big_rock_pos on tactics(big_rock_id, position);
create index if not exists milestones_big_rock_pos on milestones(big_rock_id, position);

-- ── RLS: authenticated users can do everything ────────────────

alter table config      enable row level security;
alter table big_rocks   enable row level security;
alter table tactics     enable row level security;
alter table milestones  enable row level security;

drop policy if exists "auth all config"     on config;
drop policy if exists "auth all rocks"      on big_rocks;
drop policy if exists "auth all tactics"    on tactics;
drop policy if exists "auth all milestones" on milestones;

create policy "auth all config"     on config     for all to authenticated using (true) with check (true);
create policy "auth all rocks"      on big_rocks  for all to authenticated using (true) with check (true);
create policy "auth all tactics"    on tactics    for all to authenticated using (true) with check (true);
create policy "auth all milestones" on milestones for all to authenticated using (true) with check (true);

-- ── Seed (idempotent — only runs if empty) ────────────────────

insert into config (id, title, subtitle, note, revenue_target, strategic_phrase, channels, footer)
values (
  1,
  '2026 BIG ROCK IDEAS: Q2',
  'Quarterly strategy dashboard for high-level focus, milestones, and execution alignment',
  'This dashboard visualizes the core strategic bets for Q2. Detailed execution lives in ClickUp.',
  '$1.94M',
  'Scalable channels and infrastructure for long-term ecommerce growth.',
  '[{"label":"TikTok","value":"$547K"},{"label":"Amazon (CA & US)","value":"$923K"},{"label":"D2C (GG & HD)","value":"$473K"}]'::jsonb,
  'Detailed task execution and day-to-day prioritization live outside this dashboard. This layer is for quarterly strategic alignment and milestone tracking.'
)
on conflict (id) do nothing;

do $$
declare r1 uuid; r2 uuid; r3 uuid;
begin
  if not exists (select 1 from big_rocks) then
    insert into big_rocks (position, title, description, channel_targets) values
      (1, 'Drive Revenue to $1.94M',
          'Deliver quarterly revenue across the highest-priority channels.',
          '[{"label":"TikTok","value":"$547K"},{"label":"Amazon (CA & US)","value":"$923K"},{"label":"D2C (GG & HD)","value":"$473K"}]'::jsonb)
      returning id into r1;

    insert into big_rocks (position, title, description) values
      (2, 'Achieve TikTok Break-even at 2.0 ROI',
          'Prioritize halo effect in US while improving TikTok efficiency.')
      returning id into r2;

    insert into big_rocks (position, title, description) values
      (3, 'Strengthen eCommerce Infrastructure',
          'Build the operational and technical foundation needed for scale.')
      returning id into r3;

    insert into tactics (big_rock_id, position, text) values
      (r1, 1, 'Maximize revenue across core ecommerce channels'),
      (r1, 2, 'Maintain clear channel-level ownership and targets'),
      (r1, 3, 'Keep the quarter anchored to revenue delivery'),
      (r1, 4, 'Focus execution on the highest-leverage growth drivers'),
      (r2, 1, 'Scale experimentation to improve efficiency'),
      (r2, 2, 'Expand top-of-funnel in partnership with Fiena'),
      (r2, 3, 'Launch and scale a second SKU, possibly Detox'),
      (r2, 4, 'Improve consistency in performance management'),
      (r3, 1, 'Maintain >45 days of inventory coverage for hero SKUs'),
      (r3, 2, 'Execute the full website rebuild'),
      (r3, 3, 'Complete Amazon US migration to Ginger Defence'),
      (r3, 4, 'Scale adoption of Claude Code across workflows');

    insert into milestones (big_rock_id, position, name, date, status) values
      (r1, 1, 'Channel targets finalized',        'Apr 10', 'completed'),
      (r1, 2, 'Monthly pacing model locked',      'Apr 15', 'in-progress'),
      (r1, 3, 'Mid-quarter revenue checkpoint',   'May 15', 'upcoming'),
      (r1, 4, 'Final channel push plan',          'Jun 10', 'upcoming'),
      (r2, 1, 'Testing roadmap approved',         'Apr 12', 'completed'),
      (r2, 2, 'TOF expansion live',               'Apr 25', 'in-progress'),
      (r2, 3, 'Second SKU launched',              'May 20', 'upcoming'),
      (r2, 4, 'Break-even performance sustained', 'Jun 12', 'upcoming'),
      (r3, 1, 'Inventory coverage plan locked',   'Apr 8',  'completed'),
      (r3, 2, 'Website rebuild phase 1 complete', 'May 5',  'in-progress'),
      (r3, 3, 'Amazon US migration complete',     'May 30', 'upcoming'),
      (r3, 4, 'Claude workflow adoption checkpoint', 'Jun 15', 'upcoming');
  end if;
end $$;

-- Partner MXF — relationship maintenance app
-- Run against influence-mxf (xszbmmwhhmaozjnparhj)

-- Partner profile (one row per user/relationship)
create table if not exists partner_profiles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default '',
  repair_style text not null default 'time'
                 check (repair_style in ('words','time','acts','gifts','consistency')),
  comm_sensitivity text not null default 'medium'
                 check (comm_sensitivity in ('low','medium','high')),
  gift_sensitivity text not null default 'low'
                 check (gift_sensitivity in ('low','medium','high')),
  best_connection_format text not null default 'dinner'
                 check (best_connection_format in ('dinner','walk','call','shared-activity','low-key-hang')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Daily relationship logs
create table if not exists daily_relationship_logs (
  id                    uuid primary key default gen_random_uuid(),
  log_date              date not null unique,
  replied_consistently  text not null check (replied_consistently in ('yes','somewhat','no')),
  initiated_contact     boolean not null default false,
  meaningful_connection boolean not null default false,
  guilt_flags           text[] not null default '{}',
  operator_mode         boolean not null default false,
  notes                 text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_daily_logs_date
  on daily_relationship_logs (log_date desc);

-- Repair recommendations (archived snapshots)
create table if not exists repair_recommendations (
  id              uuid primary key default gen_random_uuid(),
  level           smallint not null check (level between 0 and 3),
  drift_level     text not null check (drift_level in ('solid','light-drift','noticeable','friction')),
  drift_score     smallint not null,
  why             text not null,
  say_light       text not null,
  say_direct      text not null,
  say_warm        text not null,
  action_desc     text not null,
  action_intensity text not null,
  guardrail       text,
  generated_at    timestamptz not null default now()
);

-- Communication templates (custom overrides)
create table if not exists communication_templates (
  id          uuid primary key default gen_random_uuid(),
  drift_level text not null check (drift_level in ('solid','light-drift','noticeable','friction')),
  tone        text not null check (tone in ('light','direct','warm')),
  body        text not null,
  created_at  timestamptz not null default now()
);

-- Repair outcomes (learning loop)
create table if not exists repair_outcomes (
  id            uuid primary key default gen_random_uuid(),
  log_date      date not null,
  drift_level   text not null check (drift_level in ('solid','light-drift','noticeable','friction')),
  message_used  text,
  action_taken  text,
  landed        text check (landed in ('yes','neutral','no')),
  overdid       boolean,
  underdid      boolean,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_outcomes_date
  on repair_outcomes (log_date desc);

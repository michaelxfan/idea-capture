-- Dual Intent OS — initial schema
-- Run via Supabase SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";

-- profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  full_name text
);

alter table public.profiles enable row level security;

create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_upsert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- captures ----------------------------------------------------------------
create table if not exists public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  domain text check (domain in ('work','health','social','admin','creative','personal')),
  situation_text text not null,
  time_available_minutes integer,
  energy_level text check (energy_level in ('low','medium','high')),
  emotional_tone text check (emotional_tone in ('calm','resistant','anxious','tired','excited','unclear')),
  stakes text check (stakes in ('low','medium','high')),

  ai_status text not null default 'pending' check (ai_status in ('pending','ready','failed')),
  a_intention text,
  b_intention text,
  threshold_type text check (threshold_type in ('time','energy','ambiguity','emotional_discomfort','social_risk','uncertainty','friction','mixed','unclear')),
  threshold_description text,
  current_mode text check (current_mode in ('A','B','mixed','unclear')),
  evidence text,
  b_classification text check (b_classification in ('strategic','protective','avoidant','healthy','mixed','unclear')),
  recommendation text,
  minimum_viable_a text,

  outcome_status text check (outcome_status in ('stayed_in_a','switched_to_b','b_was_correct','regretted_switch','learned')),
  reflection_note text
);

create index if not exists captures_user_created_idx on public.captures (user_id, created_at desc);
create index if not exists captures_user_domain_idx on public.captures (user_id, domain);

alter table public.captures enable row level security;

create policy "captures_self_all" on public.captures
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pattern_snapshots --------------------------------------------------------
create table if not exists public.pattern_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  summary_json jsonb not null default '{}'::jsonb,
  narrative_summary text
);

create index if not exists pattern_snapshots_user_idx on public.pattern_snapshots (user_id, created_at desc);

alter table public.pattern_snapshots enable row level security;

create policy "pattern_snapshots_self_all" on public.pattern_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Add a JSONB column to cache AI-generated execution steps per tactic.
-- Run in: Supabase Dashboard → SQL Editor → New Query.

alter table tactics
  add column if not exists plan_steps jsonb;

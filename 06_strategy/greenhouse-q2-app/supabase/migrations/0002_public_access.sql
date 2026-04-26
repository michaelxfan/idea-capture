-- ══════════════════════════════════════════════════════════════
--  Open the dashboard to public (anon) read + write.
--  Run this in: Supabase Dashboard → SQL Editor → New Query
--  WARNING: anyone with the site URL can edit the dashboard.
-- ══════════════════════════════════════════════════════════════

drop policy if exists "auth all config"     on config;
drop policy if exists "auth all rocks"      on big_rocks;
drop policy if exists "auth all tactics"    on tactics;
drop policy if exists "auth all milestones" on milestones;

create policy "public all config"     on config     for all to anon, authenticated using (true) with check (true);
create policy "public all rocks"      on big_rocks  for all to anon, authenticated using (true) with check (true);
create policy "public all tactics"    on tactics    for all to anon, authenticated using (true) with check (true);
create policy "public all milestones" on milestones for all to anon, authenticated using (true) with check (true);

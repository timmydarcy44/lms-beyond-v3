-- ============================================================================
-- Repair LMS schema: dashboard tables, handicap pilotage, enrollments.learner_id
-- Aligns with src/lib/queries/formateur.ts (select columns) and
-- src/app/dashboard/ecole/handicap/pilotage/[id]/page.tsx (upsert/insert).
-- Run in Supabase SQL Editor after backup. Requires public.profiles to exist.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Dashboard formateur (getFormateurDashboardData)
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action_type text not null,
  summary text,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_activity_logs_user_created_idx
  on public.dashboard_activity_logs (user_id, created_at desc);

create table if not exists public.dashboard_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  message text,
  severity text not null default 'info',
  status text not null default 'active',
  scope text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_alerts_user_status_idx
  on public.dashboard_alerts (user_id, status, created_at desc);

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  resource_type text not null,
  resource_id uuid,
  resource_slug text,
  resource_title text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists user_favorites_user_sort_idx
  on public.user_favorites (user_id, sort_order, created_at);

-- ---------------------------------------------------------------------------
-- 2) Handicap / pilotage (client upsert + insert)
-- ---------------------------------------------------------------------------
create table if not exists public.apprenants (
  id uuid primary key references public.profiles (id) on delete cascade,
  synthese_ia_profonde text,
  consentement_rgpd text,
  consentement_rgpd_at timestamptz,
  rqth_uploaded boolean default false,
  school_id uuid,
  onboarding_step smallint default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_suivi (
  id uuid primary key default gen_random_uuid(),
  apprenant_id uuid not null references public.apprenants (id) on delete cascade,
  type text,
  date text,
  content text,
  created_at timestamptz not null default now()
);

create index if not exists journal_suivi_apprenant_idx
  on public.journal_suivi (apprenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3) enrollments.learner_id + unique (assignLearnersToCourse upsert)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'enrollments'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'enrollments' and column_name = 'learner_id'
    ) then
      alter table public.enrollments
        add column learner_id uuid references public.profiles (id) on delete cascade;
      update public.enrollments set learner_id = user_id where learner_id is null and user_id is not null;
    end if;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'enrollments_learner_course_unique'
      and conrelid = 'public.enrollments'::regclass
  ) then
    alter table public.enrollments
      add constraint enrollments_learner_course_unique unique (learner_id, course_id);
  end if;
exception
  when duplicate_object then null;
  when others then
    raise notice 'enrollments unique (learner_id, course_id) skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Row Level Security
-- ---------------------------------------------------------------------------
alter table public.dashboard_activity_logs enable row level security;
alter table public.dashboard_alerts enable row level security;
alter table public.user_favorites enable row level security;
alter table public.apprenants enable row level security;
alter table public.journal_suivi enable row level security;

drop policy if exists "dashboard_activity_logs_own" on public.dashboard_activity_logs;
create policy "dashboard_activity_logs_own"
  on public.dashboard_activity_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "dashboard_alerts_select" on public.dashboard_alerts;
create policy "dashboard_alerts_select"
  on public.dashboard_alerts
  for select
  to authenticated
  using (
    status = 'active'
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "user_favorites_own" on public.user_favorites;
create policy "user_favorites_own"
  on public.user_favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Apprenant row: self OR staff (admin / instructor / tutor) for pilotage école
drop policy if exists "apprenants_select" on public.apprenants;
create policy "apprenants_select"
  on public.apprenants
  for select
  to authenticated
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and pr.role in ('admin', 'instructor', 'tutor')
    )
  );

drop policy if exists "apprenants_insert_own" on public.apprenants;
create policy "apprenants_insert_own"
  on public.apprenants
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "apprenants_insert_staff" on public.apprenants;
create policy "apprenants_insert_staff"
  on public.apprenants
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and pr.role in ('admin', 'instructor', 'tutor')
    )
  );

drop policy if exists "apprenants_update" on public.apprenants;
create policy "apprenants_update"
  on public.apprenants
  for update
  to authenticated
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and pr.role in ('admin', 'instructor', 'tutor')
    )
  )
  with check (
    auth.uid() = id
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and pr.role in ('admin', 'instructor', 'tutor')
    )
  );

drop policy if exists "journal_suivi_all" on public.journal_suivi;
create policy "journal_suivi_all"
  on public.journal_suivi
  for all
  to authenticated
  using (
    auth.uid() = apprenant_id
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and pr.role in ('admin', 'instructor', 'tutor')
    )
  )
  with check (
    auth.uid() = apprenant_id
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and pr.role in ('admin', 'instructor', 'tutor')
    )
  );

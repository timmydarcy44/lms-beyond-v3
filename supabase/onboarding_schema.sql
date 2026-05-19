-- Beyond Center — Onboarding schema (Supabase / Postgres)
-- Objectif : stocker un onboarding B2B simple (workspace, invitations, diagnostic initial + suivis).
-- ⚠️ Ce script est volontairement minimal (emails & envois simulés côté app).

begin;

-- 1) Profiles : extension des champs nécessaires
alter table if exists public.profiles
  add column if not exists company_name text,
  add column if not exists company_logo text,
  add column if not exists company_goal text,
  add column if not exists subscription_plan text,
  add column if not exists collaborator_count integer;

-- 2) Pending invitations
create table if not exists public.pending_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  status text not null default 'sent' check (status in ('sent','accepted')),
  created_at timestamptz not null default now()
);

create index if not exists pending_invitations_company_id_idx on public.pending_invitations(company_id);
create index if not exists pending_invitations_email_idx on public.pending_invitations(email);

-- 3) Surveys : diagnostic initial + suivis
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  kind text not null default 'initial' check (kind in ('initial','weekly','monthly')),
  status text not null default 'draft' check (status in ('draft','active','closed')),
  created_at timestamptz not null default now()
);

create index if not exists surveys_company_id_idx on public.surveys(company_id);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists survey_responses_survey_id_idx on public.survey_responses(survey_id);
create index if not exists survey_responses_user_id_idx on public.survey_responses(user_id);

-- 4) RLS (conservateur)
alter table if exists public.pending_invitations enable row level security;
alter table if exists public.surveys enable row level security;
alter table if exists public.survey_responses enable row level security;

-- Politiques simples :
-- - en attendant une logique fine d’entreprise/manager, on autorise uniquement le "self" (propriétaire) si applicable.
-- - le service role (backend) n’est pas concerné par RLS.

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'pending_invitations' and policyname = 'pending_invitations_read_own'
  ) then
    create policy pending_invitations_read_own on public.pending_invitations
      for select
      using (company_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'surveys' and policyname = 'surveys_read_own'
  ) then
    create policy surveys_read_own on public.surveys
      for select
      using (company_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'survey_responses' and policyname = 'survey_responses_read_own'
  ) then
    create policy survey_responses_read_own on public.survey_responses
      for select
      using (user_id = auth.uid());
  end if;
end $$;

commit;


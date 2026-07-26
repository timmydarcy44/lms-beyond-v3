-- Questionnaires Jessica (définitions éditables) + réponses
-- Pas de FK vers jessica_cabinet_patients / profiles : UUIDs libres
-- (certaines bases n'ont pas encore toutes les tables cabinet).

create table if not exists public.jessica_questionnaires (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists jessica_questionnaires_active_idx
  on public.jessica_questionnaires (is_active);

alter table public.jessica_questionnaires enable row level security;

drop policy if exists jessica_questionnaires_super_admin on public.jessica_questionnaires;
create policy jessica_questionnaires_super_admin
  on public.jessica_questionnaires
  for all
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid()
    )
  );

create table if not exists public.jessica_questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_slug text not null,
  questionnaire_id uuid references public.jessica_questionnaires(id) on delete set null,
  external_id text unique,
  respondent_email text,
  respondent_first_name text,
  respondent_last_name text,
  respondent_phone text,
  child_first_name text,
  child_last_name text,
  cabinet_patient_id uuid,
  profile_id uuid,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  score_label text,
  submitted_at timestamptz,
  source text not null default 'crm',
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists jessica_questionnaire_responses_slug_idx
  on public.jessica_questionnaire_responses (questionnaire_slug);

create index if not exists jessica_questionnaire_responses_qid_idx
  on public.jessica_questionnaire_responses (questionnaire_id);

create index if not exists jessica_questionnaire_responses_email_idx
  on public.jessica_questionnaire_responses (lower(respondent_email));

create index if not exists jessica_questionnaire_responses_patient_idx
  on public.jessica_questionnaire_responses (cabinet_patient_id);

create index if not exists jessica_questionnaire_responses_profile_idx
  on public.jessica_questionnaire_responses (profile_id);

create index if not exists jessica_questionnaire_responses_child_idx
  on public.jessica_questionnaire_responses (lower(child_last_name), lower(child_first_name));

alter table public.jessica_questionnaire_responses enable row level security;

drop policy if exists jessica_questionnaire_responses_super_admin on public.jessica_questionnaire_responses;
create policy jessica_questionnaire_responses_super_admin
  on public.jessica_questionnaire_responses
  for all
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid()
    )
  );

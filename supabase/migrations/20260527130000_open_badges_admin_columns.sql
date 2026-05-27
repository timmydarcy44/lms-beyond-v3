-- Étend public.open_badges pour l’admin Open Badges (/super/open-badges/badgeclasses)
-- Compatible avec les lignes studio existantes (course_id).

alter table public.open_badges
  add column if not exists org_id uuid references public.organizations (id) on delete set null;

alter table public.open_badges
  add column if not exists name text;

alter table public.open_badges
  add column if not exists criteria text;

alter table public.open_badges
  add column if not exists status text not null default 'draft';

alter table public.open_badges
  add column if not exists visible_in_learner_dashboard boolean not null default false;

alter table public.open_badges
  add column if not exists requires_enrollment boolean not null default false;

alter table public.open_badges
  add column if not exists required_course_id uuid references public.courses (id) on delete set null;

alter table public.open_badges
  add column if not exists evaluation_config jsonb not null default '{}'::jsonb;

alter table public.open_badges
  add column if not exists created_by_user_id uuid references auth.users (id) on delete set null;

-- Badges « classe » sans formation liée : course_id optionnel
alter table public.open_badges
  alter column course_id drop not null;

alter table public.open_badges
  drop constraint if exists open_badges_course_id_unique;

create unique index if not exists open_badges_course_id_unique
  on public.open_badges (course_id)
  where course_id is not null;

create index if not exists open_badges_org_id_idx on public.open_badges (org_id);

comment on column public.open_badges.evaluation_config is
  'Config admin : level, evaluationMethods, methodConfigs, receivability, criteria[], etc.';

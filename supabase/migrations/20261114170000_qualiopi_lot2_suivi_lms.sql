-- Qualiopi Lot 2 (RNQ V10) — suivi distanciel ind. 19
-- Additive only. Pas de modification CFA.

-- Bridge dossier ↔ cours LMS ↔ participant
create table if not exists public.formation_lms_enrollments (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  participant_id uuid not null references public.formation_participants (id) on delete cascade,
  lms_course_id uuid not null references public.courses (id) on delete restrict,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (dossier_id, participant_id, lms_course_id)
);

create index if not exists formation_lms_enrollments_dossier_idx
  on public.formation_lms_enrollments (dossier_id);
create index if not exists formation_lms_enrollments_participant_idx
  on public.formation_lms_enrollments (participant_id);
create index if not exists formation_lms_enrollments_course_idx
  on public.formation_lms_enrollments (lms_course_id);

comment on table public.formation_lms_enrollments is
  'Qualiopi ind.19 — lien dossier formation / apprenant / cours LMS pour relevés distanciel.';

-- Multi-intervenants (complète trainer_user_id lead)
create table if not exists public.formation_dossier_trainers (
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'co'
    check (role in ('lead', 'co')),
  is_pedagogical_referent boolean not null default false,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id) on delete set null,
  primary key (dossier_id, user_id)
);

create index if not exists formation_dossier_trainers_user_idx
  on public.formation_dossier_trainers (user_id);

-- Un seul référent pédagogique par dossier
create unique index if not exists formation_dossier_trainers_referent_uidx
  on public.formation_dossier_trainers (dossier_id)
  where is_pedagogical_referent = true;

-- Un seul lead par dossier
create unique index if not exists formation_dossier_trainers_lead_uidx
  on public.formation_dossier_trainers (dossier_id)
  where role = 'lead';

comment on table public.formation_dossier_trainers is
  'Qualiopi ind.19 — intervenants du dossier. Alerte app si count > 8 sans référent pédagogique.';
comment on column public.formation_dossier_trainers.is_pedagogical_referent is
  'Référent pédagogique obligatoire quand plus de 8 intervenants.';

alter table public.formation_lms_enrollments enable row level security;
alter table public.formation_dossier_trainers enable row level security;

drop policy if exists formation_lms_enrollments_staff on public.formation_lms_enrollments;
create policy formation_lms_enrollments_staff on public.formation_lms_enrollments
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_dossier_trainers_staff on public.formation_dossier_trainers;
create policy formation_dossier_trainers_staff on public.formation_dossier_trainers
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

-- Backfill leads depuis trainer_user_id existant
insert into public.formation_dossier_trainers (dossier_id, user_id, role, assigned_at)
select d.id, d.trainer_user_id, 'lead', coalesce(d.trainer_assigned_at, now())
from public.formation_dossiers d
where d.trainer_user_id is not null
on conflict (dossier_id, user_id) do update
  set role = excluded.role;

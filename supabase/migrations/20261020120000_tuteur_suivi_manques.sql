-- Suivi tuteur : uniquement les objets qui n'existent pas encore.
-- Déjà en base, ne pas recréer :
--   tutor_assignments, tutor_missions, tutor_mission_logs,
--   tutor_followup_forms, tutor_followup_questions, tutor_followup_responses,
--   school_years, school_classes, school_planning_slots, class_enrollments,
--   school_absences (absences rattachées à un créneau école),
--   learning_sessions (activité plateforme),
--   consentement entreprise (disc_shared / idmc_shared / soft_skills_shared) :
--   c'est le partage RH, pas le partage tuteur.

alter table public.tutor_missions
  add column if not exists competency_label text,
  add column if not exists competency_code text;

create table if not exists public.contract_milestones (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  title text not null,
  due_on date not null,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists contract_milestones_learner_idx
  on public.contract_milestones (learner_id, due_on);

create table if not exists public.tutor_interviews (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  starts_at timestamptz not null,
  place text,
  participants text,
  status text not null default 'planned',
  report jsonb,
  created_at timestamptz not null default now(),
  constraint tutor_interviews_status_chk check (status in ('planned', 'prepare', 'done'))
);

create index if not exists tutor_interviews_learner_idx
  on public.tutor_interviews (learner_id, starts_at);

create table if not exists public.tutor_absence_reports (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  absence_date date not null,
  motif text,
  created_at timestamptz not null default now()
);

create index if not exists tutor_absence_reports_learner_idx
  on public.tutor_absence_reports (learner_id, absence_date);

create table if not exists public.test_results_sharing (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null,
  shared_with text not null default 'tutor',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint test_results_sharing_scope_chk check (scope in ('disc', 'idmc', 'soft_skills')),
  constraint test_results_sharing_unique unique (student_id, scope, shared_with)
);

create table if not exists public.test_results_views (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null,
  viewed_at timestamptz not null default now()
);

alter table public.contract_milestones enable row level security;
alter table public.tutor_interviews enable row level security;
alter table public.tutor_absence_reports enable row level security;
alter table public.test_results_sharing enable row level security;
alter table public.test_results_views enable row level security;

drop policy if exists contract_milestones_tutor on public.contract_milestones;
create policy contract_milestones_tutor on public.contract_milestones
  for all
  using (
    exists (
      select 1 from public.tutor_assignments a
      where a.learner_id = contract_milestones.learner_id
        and a.tutor_id = auth.uid()
        and a.status in ('active', 'paused')
    )
    or learner_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.tutor_assignments a
      where a.learner_id = contract_milestones.learner_id
        and a.tutor_id = auth.uid()
        and a.status in ('active', 'paused')
    )
  );

drop policy if exists tutor_interviews_tutor on public.tutor_interviews;
create policy tutor_interviews_tutor on public.tutor_interviews
  for all
  using (tutor_id = auth.uid() or learner_id = auth.uid())
  with check (
    tutor_id = auth.uid()
    and exists (
      select 1 from public.tutor_assignments a
      where a.learner_id = tutor_interviews.learner_id
        and a.tutor_id = auth.uid()
        and a.status in ('active', 'paused')
    )
  );

drop policy if exists tutor_absence_reports_tutor on public.tutor_absence_reports;
create policy tutor_absence_reports_tutor on public.tutor_absence_reports
  for all
  using (tutor_id = auth.uid() or learner_id = auth.uid())
  with check (
    tutor_id = auth.uid()
    and exists (
      select 1 from public.tutor_assignments a
      where a.learner_id = tutor_absence_reports.learner_id
        and a.tutor_id = auth.uid()
        and a.status in ('active', 'paused')
    )
  );

drop policy if exists test_results_sharing_student on public.test_results_sharing;
create policy test_results_sharing_student on public.test_results_sharing
  for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists test_results_sharing_tutor_read on public.test_results_sharing;
create policy test_results_sharing_tutor_read on public.test_results_sharing
  for select
  using (
    revoked_at is null
    and shared_with = 'tutor'
    and exists (
      select 1 from public.tutor_assignments a
      where a.learner_id = test_results_sharing.student_id
        and a.tutor_id = auth.uid()
        and a.status in ('active', 'paused')
    )
  );

drop policy if exists test_results_views_insert on public.test_results_views;
create policy test_results_views_insert on public.test_results_views
  for insert
  with check (viewer_id = auth.uid());

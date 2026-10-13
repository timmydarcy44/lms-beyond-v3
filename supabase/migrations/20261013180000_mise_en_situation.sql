-- Mise en situation : scénario secret + colonnes sur les sessions d'entretien existantes.

create table if not exists public.experiential_interview_scenarios (
  id uuid primary key default gen_random_uuid(),
  block_id text not null unique,
  course_id uuid references public.courses (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  scenario jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.experiential_interview_scenarios enable row level security;

drop policy if exists experiential_interview_scenarios_staff on public.experiential_interview_scenarios;
create policy experiential_interview_scenarios_staff
  on public.experiential_interview_scenarios
  for all
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
    or exists (
      select 1 from public.org_memberships m
      where m.user_id = auth.uid()
        and m.role in ('admin', 'instructor', 'formateur', 'tutor', 'owner', 'staff')
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
    or exists (
      select 1 from public.org_memberships m
      where m.user_id = auth.uid()
        and m.role in ('admin', 'instructor', 'formateur', 'tutor', 'owner', 'staff')
    )
  );

create table if not exists public.experiential_interview_private (
  session_id uuid primary key references public.experiential_interview_sessions (id) on delete cascade,
  model_messages jsonb not null default '[]'::jsonb,
  turn_states jsonb not null default '[]'::jsonb
);

alter table public.experiential_interview_private enable row level security;

drop policy if exists experiential_interview_private_staff_select on public.experiential_interview_private;
create policy experiential_interview_private_staff_select
  on public.experiential_interview_private
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.experiential_interview_sessions s
      join public.org_memberships learner on learner.user_id = s.user_id
      join public.org_memberships staff on staff.org_id = learner.org_id and staff.user_id = auth.uid()
      where s.id = session_id
        and staff.role in ('admin', 'instructor', 'formateur', 'tutor', 'owner', 'staff')
    )
    or exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

alter table public.experiential_interview_sessions
  add column if not exists variant_id text,
  add column if not exists variant_name text,
  add column if not exists score integer,
  add column if not exists criteria jsonb,
  add column if not exists ending text,
  add column if not exists passed boolean,
  add column if not exists feedback_md text,
  add column if not exists facts_found jsonb,
  add column if not exists traps_handled jsonb,
  add column if not exists next_step text,
  add column if not exists last_message_at timestamptz;

alter table public.experiential_interview_sessions drop constraint if exists experiential_interview_sessions_interview_style_check;
alter table public.experiential_interview_sessions
  add constraint experiential_interview_sessions_interview_style_check
  check (interview_style in ('coaching', 'experiential', 'mise_en_situation'));

alter table public.experiential_interview_sessions drop constraint if exists experiential_interview_sessions_status_check;
alter table public.experiential_interview_sessions
  add constraint experiential_interview_sessions_status_check
  check (status in ('in_progress', 'completed', 'abandoned', 'evaluation_pending'));

drop policy if exists experiential_interview_sessions_staff_select on public.experiential_interview_sessions;
create policy experiential_interview_sessions_staff_select
  on public.experiential_interview_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_memberships learner
      join public.org_memberships staff on staff.org_id = learner.org_id
      where learner.user_id = experiential_interview_sessions.user_id
        and staff.user_id = auth.uid()
        and staff.role in ('admin', 'instructor', 'formateur', 'tutor', 'owner', 'staff')
    )
  );

grant select, insert, update, delete on public.experiential_interview_scenarios to authenticated;
grant select on public.experiential_interview_private to authenticated;

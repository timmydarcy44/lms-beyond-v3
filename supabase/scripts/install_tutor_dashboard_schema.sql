-- =============================================================================
-- Installation globale : schéma tuteur (LMS) + Kanban todo_tasks + correctifs
-- =============================================================================
-- À exécuter UNE FOIS dans Supabase SQL Editor (ou psql) sur la base cible.
--
-- Corrige notamment : ERROR 42P01 relation "public.tutor_missions" does not exist
-- en créant toutes les tables tutor_* manquantes + RLS idempotentes.
--
-- Prérequis : table public.profiles (id uuid PK, typiquement = auth.users.id).
-- =============================================================================

begin;

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles est introuvable : appliquer d''abord les migrations de base (auth/profils).';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helper rôles (requis par les policies RLS)
-- ---------------------------------------------------------------------------
create or replace function public.user_has_role(
  user_id uuid,
  roles text[]
) returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  user_role text;
begin
  select p.role into user_role
  from public.profiles p
  where p.id = user_id;

  return user_role = any(roles);
exception
  when others then
    return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1) Tables tutor / suivi (ordre FK)
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_assignments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid,
  referential_id uuid,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active' check (status in ('active','paused','ended')),
  unique (tutor_id, learner_id, organization_id)
);

create index if not exists tutor_assignments_tutor_idx
  on public.tutor_assignments (tutor_id);

create index if not exists tutor_assignments_learner_idx
  on public.tutor_assignments (learner_id);

create table if not exists public.tutor_referential_library (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  domain text,
  level text,
  organization text,
  skill_focus text[],
  mission_templates jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tutor_mission_templates (
  id uuid primary key default gen_random_uuid(),
  referential_id uuid references public.tutor_referential_library(id) on delete cascade,
  title text not null,
  description text,
  objective text,
  outcome text,
  difficulty text default 'core' check (difficulty in ('starter','core','expert')),
  suggested_timeline text,
  created_at timestamptz not null default now()
);

create table if not exists public.tutor_company_profiles (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.tutor_assignments(id) on delete cascade,
  sector text,
  segments text,
  products text,
  services text,
  customers text,
  pains text,
  objectives text,
  tools text,
  ai_notes jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists tutor_company_profiles_assignment_idx
  on public.tutor_company_profiles (assignment_id);

create table if not exists public.tutor_generated_missions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.tutor_assignments(id) on delete cascade,
  prompt text,
  input_profile jsonb,
  suggestions jsonb,
  status text not null default 'draft' check (status in ('draft','accepted','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.tutor_missions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.tutor_assignments(id) on delete cascade,
  template_id uuid references public.tutor_mission_templates(id) on delete set null,
  title text not null,
  instructions text,
  due_date timestamptz,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tutor_missions_assignment_idx
  on public.tutor_missions (assignment_id, status);

create table if not exists public.tutor_mission_logs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.tutor_missions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  entry_type text not null default 'update' check (entry_type in ('update','validation','blocking','comment')),
  content text,
  created_at timestamptz not null default now()
);

create index if not exists tutor_mission_logs_mission_idx
  on public.tutor_mission_logs (mission_id);

create table if not exists public.tutor_followup_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  title text not null,
  description text,
  frequency text default 'monthly',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tutor_followup_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.tutor_followup_forms(id) on delete cascade,
  question text not null,
  question_type text not null default 'textarea' check (question_type in ('textarea','radio','checkbox','scale')),
  order_index integer not null default 0,
  metadata jsonb
);

create index if not exists tutor_followup_questions_form_idx
  on public.tutor_followup_questions (form_id, order_index);

create table if not exists public.tutor_followup_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.tutor_followup_forms(id) on delete cascade,
  question_id uuid not null references public.tutor_followup_questions(id) on delete cascade,
  assignment_id uuid not null references public.tutor_assignments(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tutor_followup_responses_assignment_idx
  on public.tutor_followup_responses (assignment_id, form_id);

-- ---------------------------------------------------------------------------
-- 2) Missions : statut invalid + motif (aligné API PATCH tuteur)
-- ---------------------------------------------------------------------------
alter table public.tutor_missions add column if not exists invalidation_reason text;

alter table public.tutor_missions drop constraint if exists tutor_missions_status_check;

alter table public.tutor_missions
  add constraint tutor_missions_status_check
  check (status in ('todo', 'in_progress', 'done', 'invalid'));

comment on column public.tutor_missions.invalidation_reason is
  'Motif saisi par le tuteur lorsque status = invalid.';

-- ---------------------------------------------------------------------------
-- 3) RLS tutor (idempotent : DROP puis CREATE)
-- ---------------------------------------------------------------------------
alter table public.tutor_assignments enable row level security;
drop policy if exists tutor_assignments_self on public.tutor_assignments;
create policy tutor_assignments_self on public.tutor_assignments
  for select using (auth.uid() = tutor_id or auth.uid() = learner_id);
drop policy if exists tutor_assignments_manage on public.tutor_assignments;
create policy tutor_assignments_manage on public.tutor_assignments
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );

alter table public.tutor_missions enable row level security;
drop policy if exists tutor_missions_self on public.tutor_missions;
create policy tutor_missions_self on public.tutor_missions
  for select using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_missions.assignment_id
        and (a.tutor_id = auth.uid() or a.learner_id = auth.uid())
    )
  );
drop policy if exists tutor_missions_manage on public.tutor_missions;
create policy tutor_missions_manage on public.tutor_missions
  for all using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_missions.assignment_id
        and (a.tutor_id = auth.uid() or auth.uid() = a.learner_id)
    )
    or public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_missions.assignment_id
        and (a.tutor_id = auth.uid() or auth.uid() = a.learner_id)
    )
    or public.user_has_role(auth.uid(), array['admin','instructor'])
  );

alter table public.tutor_mission_logs enable row level security;
drop policy if exists tutor_mission_logs_self on public.tutor_mission_logs;
create policy tutor_mission_logs_self on public.tutor_mission_logs
  for select using (
    exists (
      select 1
      from public.tutor_missions m
      join public.tutor_assignments a on a.id = m.assignment_id
      where m.id = public.tutor_mission_logs.mission_id
        and (a.tutor_id = auth.uid() or a.learner_id = auth.uid())
    )
  );
drop policy if exists tutor_mission_logs_write on public.tutor_mission_logs;
-- INSERT : uniquement WITH CHECK (pas de USING — erreur 42601).
create policy tutor_mission_logs_write on public.tutor_mission_logs
  for insert with check (
    exists (
      select 1
      from public.tutor_missions m
      join public.tutor_assignments a on a.id = m.assignment_id
      where m.id = public.tutor_mission_logs.mission_id
        and (a.tutor_id = auth.uid() or auth.uid() = a.learner_id)
    )
  );

alter table public.tutor_followup_forms enable row level security;
drop policy if exists tutor_followup_forms_admin on public.tutor_followup_forms;
create policy tutor_followup_forms_admin on public.tutor_followup_forms
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
drop policy if exists tutor_followup_forms_tutor_read on public.tutor_followup_forms;
create policy tutor_followup_forms_tutor_read on public.tutor_followup_forms
  for select using (true);

alter table public.tutor_followup_questions enable row level security;
drop policy if exists tutor_followup_questions_admin on public.tutor_followup_questions;
create policy tutor_followup_questions_admin on public.tutor_followup_questions
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
drop policy if exists tutor_followup_questions_read on public.tutor_followup_questions;
create policy tutor_followup_questions_read on public.tutor_followup_questions
  for select using (true);

alter table public.tutor_followup_responses enable row level security;
drop policy if exists tutor_followup_responses_self on public.tutor_followup_responses;
create policy tutor_followup_responses_self on public.tutor_followup_responses
  for select using (auth.uid() = tutor_id or auth.uid() = learner_id);
drop policy if exists tutor_followup_responses_insert on public.tutor_followup_responses;
create policy tutor_followup_responses_insert on public.tutor_followup_responses
  for insert with check (auth.uid() = tutor_id);
drop policy if exists tutor_followup_responses_admin on public.tutor_followup_responses;
create policy tutor_followup_responses_admin on public.tutor_followup_responses
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
drop policy if exists tutor_followup_responses_update_tutor on public.tutor_followup_responses;
create policy tutor_followup_responses_update_tutor on public.tutor_followup_responses
  for update
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

alter table public.tutor_referential_library enable row level security;
alter table public.tutor_mission_templates enable row level security;
drop policy if exists tutor_referential_admin on public.tutor_referential_library;
create policy tutor_referential_admin on public.tutor_referential_library
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
drop policy if exists tutor_mission_templates_admin on public.tutor_mission_templates;
create policy tutor_mission_templates_admin on public.tutor_mission_templates
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
drop policy if exists tutor_referential_read on public.tutor_referential_library;
create policy tutor_referential_read on public.tutor_referential_library
  for select using (true);
drop policy if exists tutor_mission_templates_read on public.tutor_mission_templates;
create policy tutor_mission_templates_read on public.tutor_mission_templates
  for select using (true);

alter table public.tutor_company_profiles enable row level security;
drop policy if exists tutor_company_profiles_self on public.tutor_company_profiles;
create policy tutor_company_profiles_self on public.tutor_company_profiles
  for select using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_company_profiles.assignment_id
        and (a.tutor_id = auth.uid() or a.learner_id = auth.uid())
    )
  );
drop policy if exists tutor_company_profiles_write on public.tutor_company_profiles;
create policy tutor_company_profiles_write on public.tutor_company_profiles
  for all using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_company_profiles.assignment_id
        and a.tutor_id = auth.uid()
    )
    or public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_company_profiles.assignment_id
        and a.tutor_id = auth.uid()
    )
    or public.user_has_role(auth.uid(), array['admin','instructor'])
  );

alter table public.tutor_generated_missions enable row level security;
drop policy if exists tutor_generated_missions_read on public.tutor_generated_missions;
create policy tutor_generated_missions_read on public.tutor_generated_missions
  for select using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_generated_missions.assignment_id
        and (a.tutor_id = auth.uid() or a.learner_id = auth.uid())
    )
  );
drop policy if exists tutor_generated_missions_write on public.tutor_generated_missions;
create policy tutor_generated_missions_write on public.tutor_generated_missions
  for all using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_generated_missions.assignment_id
        and a.tutor_id = auth.uid()
    )
    or public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_generated_missions.assignment_id
        and a.tutor_id = auth.uid()
    )
    or public.user_has_role(auth.uid(), array['admin','instructor'])
  );

-- ---------------------------------------------------------------------------
-- 4) todo_tasks (Kanban) + role_filter — idempotent
-- ---------------------------------------------------------------------------
create table if not exists public.todo_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'normal',
  school_id uuid not null references auth.users (id) on delete cascade,
  user_id uuid generated always as (school_id) stored,
  assigned_to_user_id uuid references auth.users (id) on delete set null,
  due_date timestamptz,
  task_type text,
  linked_content_type text,
  linked_content_id uuid,
  estimated_duration_minutes integer,
  actual_duration_minutes integer,
  tags text[],
  subtasks jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  kanban_position integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.todo_tasks add column if not exists role_filter text;

create index if not exists todo_tasks_school_id_created_idx
  on public.todo_tasks (school_id, created_at desc);

create index if not exists todo_tasks_school_role_idx
  on public.todo_tasks (school_id, role_filter, created_at desc);

comment on table public.todo_tasks is 'Tâches kanban LMS ; filtrées par school_id (= auth.uid() côté API).';
comment on column public.todo_tasks.school_id is 'UUID du compte propriétaire (auth.users.id).';
comment on column public.todo_tasks.role_filter is 'learner | instructor | tutor | admin — aligné KanbanBoard.';

alter table public.todo_tasks enable row level security;

drop policy if exists "todo_tasks_select_own" on public.todo_tasks;
create policy "todo_tasks_select_own"
  on public.todo_tasks for select
  using (auth.uid() = school_id);

drop policy if exists "todo_tasks_insert_own" on public.todo_tasks;
create policy "todo_tasks_insert_own"
  on public.todo_tasks for insert
  with check (auth.uid() = school_id);

drop policy if exists "todo_tasks_update_own" on public.todo_tasks;
create policy "todo_tasks_update_own"
  on public.todo_tasks for update
  using (auth.uid() = school_id);

drop policy if exists "todo_tasks_delete_own" on public.todo_tasks;
create policy "todo_tasks_delete_own"
  on public.todo_tasks for delete
  using (auth.uid() = school_id);

commit;

-- Fin : vérifier avec
-- select tablename from pg_tables where schemaname='public' and tablename like 'tutor%' order by 1;

-- 002_lms_tutor_builder_activity.sql
-- À exécuter après 000_admin_basics.sql (et 001_drive_and_groups.sql si déjà appliquée)
-- psql "$DATABASE_URL" -f supabase/migrations/002_lms_tutor_builder_activity.sql

begin;

create extension if not exists pgcrypto;

-----------------------------------------------
-- 0. Vérification/ajout de la colonne role dans profiles
-----------------------------------------------

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles add column role text;
    alter table public.profiles add constraint profiles_role_check
      check (role in ('student','instructor','admin','tutor'));
  end if;
end $$;

-----------------------------------------------
-- 1. Tests & builder avancé
-----------------------------------------------

alter table public.tests
  add column if not exists hero_image text,
  add column if not exists difficulty text,
  add column if not exists builder_snapshot jsonb,
  add column if not exists is_ai_enabled boolean not null default false;

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  question_type text not null check (question_type in ('multiple','single','open','scale')),
  title text not null,
  context text,
  order_index integer not null default 0,
  ai_generated boolean not null default false,
  base_score numeric(6,2) default 0,
  tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists test_questions_test_order_idx
  on public.test_questions (test_id, order_index);

create table if not exists public.test_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.test_questions(id) on delete cascade,
  value text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists test_question_options_question_idx
  on public.test_question_options (question_id, order_index);

create table if not exists public.test_question_scale_scores (
  question_id uuid not null references public.test_questions(id) on delete cascade,
  scale_value integer not null,
  score numeric(6,2) not null default 0,
  primary key (question_id, scale_value)
);

create table if not exists public.test_question_keyword_rules (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.test_questions(id) on delete cascade,
  keywords text[] not null default '{}',
  score numeric(6,2) not null default 0,
  match_type text not null default 'all' check (match_type in ('all','any')),
  created_at timestamptz not null default now()
);

create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  score_obtained numeric(6,2),
  score_max numeric(6,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer not null default 0,
  duration_active_seconds integer not null default 0,
  metadata jsonb
);

create index if not exists test_sessions_learner_idx
  on public.test_sessions (learner_id, test_id);

create table if not exists public.test_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete cascade,
  selected_option_ids uuid[],
  open_answer text,
  scale_value integer,
  score_obtained numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists test_responses_session_idx
  on public.test_responses (session_id);

create index if not exists test_responses_question_idx
  on public.test_responses (question_id);

-----------------------------------------------
-- 2. Tables tutor / suivi alternance
-----------------------------------------------

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

-----------------------------------------------
-- 3. Tracking activité apprenant
-----------------------------------------------

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('path','course','resource','test')),
  content_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  duration_active_seconds integer not null default 0,
  metadata jsonb
);

create index if not exists learning_sessions_user_idx
  on public.learning_sessions (user_id, content_type);

create table if not exists public.learning_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('start','stop','mousemove','idle','resume','focus','blur')),
  payload jsonb,
  happened_at timestamptz not null default now()
);

create index if not exists learning_session_events_session_idx
  on public.learning_session_events (session_id, happened_at);

create or replace view public.learner_activity_summary as
  select
    ls.user_id,
    ls.content_type,
    sum(ls.duration_seconds)::bigint as duration_seconds,
    sum(ls.duration_active_seconds)::bigint as duration_active_seconds
  from public.learning_sessions ls
  group by ls.user_id, ls.content_type;

-----------------------------------------------
-- 4. Journal IA
-----------------------------------------------

create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  context text not null,
  prompt text,
  payload_in jsonb,
  payload_out jsonb,
  status text not null default 'success' check (status in ('success','error')),
  created_at timestamptz not null default now()
);

create index if not exists ai_generation_logs_actor_idx
  on public.ai_generation_logs (actor_id, created_at desc);

-----------------------------------------------
-- 5. Fonction helper pour vérifier les rôles
-----------------------------------------------

create or replace function public.user_has_role(
  user_id uuid,
  roles text[]
) returns boolean
language plpgsql
security definer
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

-----------------------------------------------
-- 6. RLS & policies
-----------------------------------------------

alter table public.test_questions enable row level security;
alter table public.test_question_options enable row level security;
alter table public.test_question_scale_scores enable row level security;
alter table public.test_question_keyword_rules enable row level security;
alter table public.test_sessions enable row level security;
alter table public.test_responses enable row level security;

create policy test_questions_owner on public.test_questions
  for all using (
    exists (
      select 1 from public.tests t
      where t.id = test_questions.test_id
        and (
          t.created_by = auth.uid()
          or public.user_has_role(auth.uid(), array['admin','instructor'])
        )
    )
  ) with check (
    exists (
      select 1 from public.tests t
      where t.id = test_questions.test_id
        and (
          t.created_by = auth.uid()
          or public.user_has_role(auth.uid(), array['admin','instructor'])
        )
    )
  );

create policy test_question_options_inherit on public.test_question_options
  for all using (
    exists (
      select 1
      from public.test_questions q
      where q.id = test_question_options.question_id
        and (
          q.test_id in (
            select t.id from public.tests t
            where t.created_by = auth.uid()
              or public.user_has_role(auth.uid(), array['admin','instructor'])
          )
        )
    )
  ) with check (
    exists (
      select 1
      from public.test_questions q
      where q.id = test_question_options.question_id
        and (
          q.test_id in (
            select t.id from public.tests t
            where t.created_by = auth.uid()
              or public.user_has_role(auth.uid(), array['admin','instructor'])
          )
        )
    )
  );

create policy test_question_scale_inherit on public.test_question_scale_scores
  for all using (
    exists (
      select 1
      from public.test_questions q
      where q.id = test_question_scale_scores.question_id
        and (
          q.test_id in (
            select t.id from public.tests t
            where t.created_by = auth.uid()
              or public.user_has_role(auth.uid(), array['admin','instructor'])
          )
        )
    )
  ) with check (
    exists (
      select 1
      from public.test_questions q
      where q.id = test_question_scale_scores.question_id
        and (
          q.test_id in (
            select t.id from public.tests t
            where t.created_by = auth.uid()
              or public.user_has_role(auth.uid(), array['admin','instructor'])
          )
        )
    )
  );

create policy test_question_keyword_inherit on public.test_question_keyword_rules
  for all using (
    exists (
      select 1
      from public.test_questions q
      where q.id = public.test_question_keyword_rules.question_id
        and (
          q.test_id in (
            select t.id from public.tests t
            where t.created_by = auth.uid()
              or public.user_has_role(auth.uid(), array['admin','instructor'])
          )
        )
    )
  ) with check (
    exists (
      select 1
      from public.test_questions q
      where q.id = public.test_question_keyword_rules.question_id
        and (
          q.test_id in (
            select t.id from public.tests t
            where t.created_by = auth.uid()
              or public.user_has_role(auth.uid(), array['admin','instructor'])
          )
        )
    )
  );

create policy test_sessions_self_read on public.test_sessions
  for select using (auth.uid() = learner_id);
create policy test_sessions_self_upsert on public.test_sessions
  for all using (auth.uid() = learner_id) with check (auth.uid() = learner_id);
create policy test_sessions_admin_read on public.test_sessions
  for select using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );

create policy test_responses_self_read on public.test_responses
  for select using (
    exists (
      select 1
      from public.test_sessions s
      where s.id = test_responses.session_id
        and s.learner_id = auth.uid()
    )
  );
create policy test_responses_self_write on public.test_responses
  for all using (
    exists (
      select 1
      from public.test_sessions s
      where s.id = test_responses.session_id
        and s.learner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.test_sessions s
      where s.id = test_responses.session_id
        and s.learner_id = auth.uid()
    )
  );
create policy test_responses_admin on public.test_responses
  for select using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );

alter table public.tutor_assignments enable row level security;
create policy tutor_assignments_self on public.tutor_assignments
  for select using (auth.uid() = tutor_id or auth.uid() = learner_id);
create policy tutor_assignments_manage on public.tutor_assignments
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );

alter table public.tutor_missions enable row level security;
create policy tutor_missions_self on public.tutor_missions
  for select using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_missions.assignment_id
        and (a.tutor_id = auth.uid() or a.learner_id = auth.uid())
    )
  );
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
create policy tutor_mission_logs_write on public.tutor_mission_logs
  for insert using (
    exists (
      select 1
      from public.tutor_missions m
      join public.tutor_assignments a on a.id = m.assignment_id
      where m.id = public.tutor_mission_logs.mission_id
        and (a.tutor_id = auth.uid() or auth.uid() = a.learner_id)
    )
  ) with check (
    exists (
      select 1
      from public.tutor_missions m
      join public.tutor_assignments a on a.id = m.assignment_id
      where m.id = public.tutor_mission_logs.mission_id
        and (a.tutor_id = auth.uid() or auth.uid() = a.learner_id)
    )
  );

alter table public.tutor_followup_forms enable row level security;
create policy tutor_followup_forms_admin on public.tutor_followup_forms
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
create policy tutor_followup_forms_tutor_read on public.tutor_followup_forms
  for select using (true); -- lecture libre (reste filtrée côté applicatif)

alter table public.tutor_followup_questions enable row level security;
create policy tutor_followup_questions_admin on public.tutor_followup_questions
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
create policy tutor_followup_questions_read on public.tutor_followup_questions
  for select using (true);

alter table public.tutor_followup_responses enable row level security;
create policy tutor_followup_responses_self on public.tutor_followup_responses
  for select using (auth.uid() = tutor_id or auth.uid() = learner_id);
create policy tutor_followup_responses_insert on public.tutor_followup_responses
  for insert with check (auth.uid() = tutor_id);
create policy tutor_followup_responses_admin on public.tutor_followup_responses
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );

alter table public.tutor_referential_library enable row level security;
alter table public.tutor_mission_templates enable row level security;
create policy tutor_referential_admin on public.tutor_referential_library
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
create policy tutor_mission_templates_admin on public.tutor_mission_templates
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );
create policy tutor_referential_read on public.tutor_referential_library
  for select using (true);
create policy tutor_mission_templates_read on public.tutor_mission_templates
  for select using (true);

alter table public.tutor_company_profiles enable row level security;
create policy tutor_company_profiles_self on public.tutor_company_profiles
  for select using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_company_profiles.assignment_id
        and (a.tutor_id = auth.uid() or a.learner_id = auth.uid())
    )
  );
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
create policy tutor_generated_missions_read on public.tutor_generated_missions
  for select using (
    exists (
      select 1
      from public.tutor_assignments a
      where a.id = public.tutor_generated_missions.assignment_id
        and (a.tutor_id = auth.uid() or a.learner_id = auth.uid())
    )
  );
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

alter table public.learning_sessions enable row level security;
create policy learning_sessions_self on public.learning_sessions
  for select using (auth.uid() = user_id);
create policy learning_sessions_self_upsert on public.learning_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy learning_sessions_admin on public.learning_sessions
  for select using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );

alter table public.learning_session_events enable row level security;
create policy learning_session_events_self on public.learning_session_events
  for select using (
    exists (
      select 1
      from public.learning_sessions ls
      where ls.id = public.learning_session_events.session_id
        and ls.user_id = auth.uid()
    )
  );
create policy learning_session_events_self_insert on public.learning_session_events
  for insert using (
    exists (
      select 1
      from public.learning_sessions ls
      where ls.id = public.learning_session_events.session_id
        and ls.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.learning_sessions ls
      where ls.id = public.learning_session_events.session_id
        and ls.user_id = auth.uid()
    )
  );

alter table public.ai_generation_logs enable row level security;
create policy ai_generation_logs_actor on public.ai_generation_logs
  for select using (auth.uid() = actor_id);
create policy ai_generation_logs_admin on public.ai_generation_logs
  for all using (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin','instructor'])
  );

commit;











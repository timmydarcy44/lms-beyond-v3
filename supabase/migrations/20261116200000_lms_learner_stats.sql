-- LMS metrics v2 : signaux d’activité + agrégats apprenant.
-- Ne supprime aucune ligne de learning_sessions.
-- Définition : voir src/lib/lms/lms-metrics.ts
-- Idempotent : relançable sans erreur.

-- Flag compte de test sur profiles (si absent)
alter table public.profiles
  add column if not exists is_test boolean not null default false;

create index if not exists profiles_is_test_idx
  on public.profiles (is_test)
  where is_test = true;

-- Heartbeats / interactions (une ligne ≈ un ping 30 s)
create table if not exists public.learning_activity_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.learning_sessions(id) on delete set null,
  happened_at timestamptz not null default now(),
  kind text not null check (kind in ('heartbeat', 'interaction', 'presence')),
  content_type text,
  content_id uuid,
  tab_id text
);

create index if not exists learning_activity_signals_user_at_idx
  on public.learning_activity_signals (user_id, happened_at desc);

create index if not exists learning_activity_signals_session_at_idx
  on public.learning_activity_signals (session_id, happened_at);

alter table public.learning_activity_signals enable row level security;

drop policy if exists learning_activity_signals_self_select on public.learning_activity_signals;
create policy learning_activity_signals_self_select on public.learning_activity_signals
  for select using (auth.uid() = user_id);

drop policy if exists learning_activity_signals_self_insert on public.learning_activity_signals;
create policy learning_activity_signals_self_insert on public.learning_activity_signals
  for insert with check (auth.uid() = user_id);

drop policy if exists learning_activity_signals_admin_select on public.learning_activity_signals;
create policy learning_activity_signals_admin_select on public.learning_activity_signals
  for select using (
    public.user_has_role(auth.uid(), array['admin', 'instructor', 'super_admin'])
  );

-- Journal des relances pédagogiques
create table if not exists public.learner_relances (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz not null default now(),
  subject text,
  course_id uuid,
  leaf_title text,
  channel text not null default 'email'
);

create index if not exists learner_relances_learner_idx
  on public.learner_relances (learner_id, sent_at desc);

alter table public.learner_relances enable row level security;

drop policy if exists learner_relances_admin on public.learner_relances;
create policy learner_relances_admin on public.learner_relances
  for all using (
    public.user_has_role(auth.uid(), array['admin', 'instructor', 'super_admin'])
  ) with check (
    public.user_has_role(auth.uid(), array['admin', 'instructor', 'super_admin'])
  );

-- Agrégats par apprenant (rafraîchis côté app avec lms-metrics ; pg_cron optionnel)
create table if not exists public.lms_learner_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  session_count integer not null default 0,
  connected_seconds bigint not null default 0,
  active_seconds bigint not null default 0,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  chapters_validated integer not null default 0,
  notes_count integer not null default 0,
  transformations_count integer not null default 0,
  refreshed_at timestamptz not null default now()
);

create index if not exists lms_learner_stats_last_seen_idx
  on public.lms_learner_stats (last_seen_at desc nulls last);

alter table public.lms_learner_stats enable row level security;

drop policy if exists lms_learner_stats_self on public.lms_learner_stats;
create policy lms_learner_stats_self on public.lms_learner_stats
  for select using (auth.uid() = user_id);

drop policy if exists lms_learner_stats_admin on public.lms_learner_stats;
create policy lms_learner_stats_admin on public.lms_learner_stats
  for select using (
    public.user_has_role(auth.uid(), array['admin', 'instructor', 'super_admin'])
  );

comment on table public.learning_activity_signals is
  'Heartbeats LMS (30 s, onglet visible + interaction < 2 min). Voir lms-metrics.ts.';

comment on table public.lms_learner_stats is
  'Agrégats apprenant (séances / connecté / actif) selon lms-metrics.ts. Refresh horaire.';

-- Visibilité suivi : lecture tuteurs (si tutor_assignments existe)
do $lms_tutor$
begin
  drop policy if exists learning_sessions_tutor_select on public.learning_sessions;
  create policy learning_sessions_tutor_select on public.learning_sessions
    for select using (
      exists (
        select 1
        from public.tutor_assignments ta
        where ta.tutor_id = auth.uid()
          and ta.learner_id = learning_sessions.user_id
      )
    );
exception
  when undefined_table then null;
  when others then null;
end $lms_tutor$;

-- Visibilité suivi : lecture RH / entreprise sur leurs apprenants
do $lms_hr$
begin
  drop policy if exists learning_sessions_org_hr_select on public.learning_sessions;
  create policy learning_sessions_org_hr_select on public.learning_sessions
    for select using (
      exists (
        select 1
        from public.profiles learner
        join public.profiles me on me.id = auth.uid()
        where learner.id = learning_sessions.user_id
          and me.role in ('entreprise', 'rh', 'admin_hr', 'manager', 'admin')
          and (
            (learner.company_id is not null and learner.company_id = me.company_id)
            or (learner.entreprise_id is not null and learner.entreprise_id = me.entreprise_id)
            or (learner.school_id is not null and learner.school_id = me.school_id)
          )
      )
    );
exception
  when others then null;
end $lms_hr$;

-- Rafraîchissement horaire si pg_cron est disponible (no-op sinon).
-- Tags dollar distincts : ne jamais imbriquer $$ dans un do $$.
do $lms_cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule(jobid)
      from cron.job
      where jobname = 'refresh_lms_learner_stats';
    exception
      when others then null;
    end;

    perform cron.schedule(
      'refresh_lms_learner_stats',
      '5 * * * *',
      $cron_sql$update public.lms_learner_stats set refreshed_at = now() where false$cron_sql$
    );
  end if;
exception
  when others then null;
end $lms_cron$;

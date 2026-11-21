-- Calendrier d'alternance par promotion + dates d'année + feed iCal
-- Remplace l'ancienne alternance_calendar (learner_id/day/lieu, inutilisée).

-- ─── 1. Dates d'année sur la promotion (= school_classes) ───────────────────
alter table public.school_classes
  add column if not exists formation_starts_on date,
  add column if not exists formation_ends_on date,
  add column if not exists title_label text,
  add column if not exists specialty_label text;

comment on column public.school_classes.formation_starts_on is
  'Début de l''année de formation (lundi de la 1re semaine). Source pour Mon planning.';
comment on column public.school_classes.formation_ends_on is
  'Fin de l''année de formation. Source pour Mon planning.';
comment on column public.school_classes.title_label is
  'Titre préparé affiché apprenant (ex. Titre pro NTC). Masqué si null.';
comment on column public.school_classes.specialty_label is
  'Spécialité affichée apprenant (ex. Business Sport). Masqué si null.';

-- ─── 2. Remplacer l'ancienne alternance_calendar ────────────────────────────
drop table if exists public.alternance_calendar cascade;

create table public.alternance_calendar (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.school_classes (id) on delete cascade,
  week_starts_on date not null,
  week_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alternance_calendar_week_type_chk
    check (week_type in ('school', 'company', 'holiday', 'exam')),
  constraint alternance_calendar_week_monday_chk
    check (extract(isodow from week_starts_on) = 1),
  constraint alternance_calendar_class_week_uidx unique (class_id, week_starts_on)
);

create index alternance_calendar_class_id_idx
  on public.alternance_calendar (class_id);

create index alternance_calendar_week_starts_on_idx
  on public.alternance_calendar (week_starts_on);

comment on table public.alternance_calendar is
  'Calendrier d''alternance par promotion (school_classes) : une ligne = une semaine.';

alter table public.alternance_calendar enable row level security;

drop policy if exists alternance_calendar_select on public.alternance_calendar;
create policy alternance_calendar_select on public.alternance_calendar
  for select to authenticated
  using (
    exists (
      select 1 from public.class_enrollments e
      where e.class_id = alternance_calendar.class_id
        and e.student_id = auth.uid()
    )
    or exists (
      select 1 from public.school_classes c
      join public.profiles p on p.school_id = c.school_id
      where c.id = alternance_calendar.class_id
        and p.id = auth.uid()
        and lower(coalesce(p.role_type, '')) in ('ecole', 'school', 'admin', 'super_admin', 'school_admin')
    )
    or exists (
      select 1 from public.class_enrollments e
      join public.tutor_assignments ta on ta.learner_id = e.student_id
      where e.class_id = alternance_calendar.class_id
        and ta.tutor_id = auth.uid()
    )
  );

drop policy if exists alternance_calendar_write_school on public.alternance_calendar;
create policy alternance_calendar_write_school on public.alternance_calendar
  for all to authenticated
  using (
    exists (
      select 1 from public.school_classes c
      join public.profiles p on p.school_id = c.school_id
      where c.id = alternance_calendar.class_id
        and p.id = auth.uid()
        and lower(coalesce(p.role_type, '')) in ('ecole', 'school', 'admin', 'super_admin', 'school_admin')
    )
  )
  with check (
    exists (
      select 1 from public.school_classes c
      join public.profiles p on p.school_id = c.school_id
      where c.id = alternance_calendar.class_id
        and p.id = auth.uid()
        and lower(coalesce(p.role_type, '')) in ('ecole', 'school', 'admin', 'super_admin', 'school_admin')
    )
  );

-- ─── 3. Enrichir les séances ────────────────────────────────────────────────
alter table public.school_planning_slots
  add column if not exists learner_instruction text;

comment on column public.school_planning_slots.learner_instruction is
  'Consigne visible apprenant (ex. apporte ton dossier entreprise). Null = masquée.';

alter table public.school_planning_slots
  drop constraint if exists school_planning_slots_event_type_chk;

alter table public.school_planning_slots
  add constraint school_planning_slots_event_type_chk
  check (event_type in (
    'course',
    'evaluation',
    'project',
    'referent',
    'exam',
    'outing',
    'masterclass',
    'elearning'
  ));

-- ─── 4. Feed iCal personnel ─────────────────────────────────────────────────
create table if not exists public.learner_calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists learner_calendar_feeds_active_uidx
  on public.learner_calendar_feeds (learner_id)
  where revoked_at is null;

create index if not exists learner_calendar_feeds_token_idx
  on public.learner_calendar_feeds (token);

alter table public.learner_calendar_feeds enable row level security;

drop policy if exists learner_calendar_feeds_self on public.learner_calendar_feeds;
create policy learner_calendar_feeds_self on public.learner_calendar_feeds
  for all to authenticated
  using (learner_id = auth.uid())
  with check (learner_id = auth.uid());

comment on table public.learner_calendar_feeds is
  'Jeton secret pour /api/calendar/{token}.ics — régénérable (révocation).';

-- Cursus présentiels / hybrides + émargement numérique (entrée / sortie)
-- Absences générées depuis l'émargement (pas saisie manuelle principale).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- CURSUS
-- ---------------------------------------------------------------------------
create table if not exists public.school_curricula (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  school_year_id uuid references public.school_years (id) on delete set null,
  name text not null,
  code text,
  description text,
  starts_on date,
  ends_on date,
  total_hours numeric(8,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_curricula_hours_nonneg check (total_hours >= 0),
  constraint school_curricula_status_chk check (status in ('active', 'draft', 'archived'))
);

create index if not exists school_curricula_school_id_idx on public.school_curricula (school_id);
create unique index if not exists school_curricula_school_code_uidx
  on public.school_curricula (school_id, lower(code))
  where code is not null and length(trim(code)) > 0;

create table if not exists public.school_curriculum_modules (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.school_curricula (id) on delete cascade,
  school_id uuid not null,
  name text not null,
  code text,
  description text,
  planned_hours_total numeric(8,2) not null default 0,
  sort_order integer not null default 0,
  online_course_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_curriculum_modules_hours_nonneg check (planned_hours_total >= 0)
);

create index if not exists school_curriculum_modules_curriculum_idx
  on public.school_curriculum_modules (curriculum_id);
create index if not exists school_curriculum_modules_school_idx
  on public.school_curriculum_modules (school_id);

alter table public.school_classes
  add column if not exists curriculum_id uuid references public.school_curricula (id) on delete set null;

create index if not exists school_classes_curriculum_id_idx on public.school_classes (curriculum_id);

alter table public.school_planning_modules
  add column if not exists curriculum_module_id uuid references public.school_curriculum_modules (id) on delete set null;

create index if not exists school_planning_modules_curriculum_module_idx
  on public.school_planning_modules (curriculum_module_id);

-- ---------------------------------------------------------------------------
-- ÉMARGEMENT (session par créneau)
-- ---------------------------------------------------------------------------
create table if not exists public.school_attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  slot_id uuid not null references public.school_planning_slots (id) on delete cascade,
  status text not null default 'draft',
  checkin_opens_at timestamptz,
  checkin_closes_at timestamptz,
  checkout_opens_at timestamptz,
  checkout_closes_at timestamptz,
  closed_at timestamptz,
  opened_by uuid references public.profiles (id) on delete set null,
  closed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_attendance_sessions_status_chk check (
    status in ('draft', 'checkin_open', 'checkout_open', 'closed')
  ),
  constraint school_attendance_sessions_slot_uidx unique (slot_id)
);

create index if not exists school_attendance_sessions_school_idx
  on public.school_attendance_sessions (school_id);

-- QR tokens temporaires (phase checkin | checkout)
create table if not exists public.school_attendance_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_attendance_sessions (id) on delete cascade,
  school_id uuid not null,
  phase text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint school_attendance_qr_phase_chk check (phase in ('checkin', 'checkout'))
);

create unique index if not exists school_attendance_qr_token_hash_uidx
  on public.school_attendance_qr_tokens (token_hash);
create index if not exists school_attendance_qr_session_idx
  on public.school_attendance_qr_tokens (session_id);

-- Présences (états riches, pas un boolean)
create table if not exists public.school_attendance_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  session_id uuid not null references public.school_attendance_sessions (id) on delete cascade,
  slot_id uuid not null references public.school_planning_slots (id) on delete cascade,
  learner_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'not_signed',
  checkin_at timestamptz,
  checkout_at timestamptz,
  checkin_method text,
  checkout_method text,
  minutes_late integer,
  minutes_early_leave integer,
  expected_hours numeric(8,2),
  credited_hours numeric(8,2),
  absence_id uuid references public.school_absences (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_attendance_records_status_chk check (
    status in (
      'present',
      'absent',
      'late',
      'early_leave',
      'partial',
      'incomplete',
      'not_signed'
    )
  ),
  constraint school_attendance_records_session_learner_uidx unique (session_id, learner_id)
);

create index if not exists school_attendance_records_slot_idx
  on public.school_attendance_records (slot_id);
create index if not exists school_attendance_records_learner_idx
  on public.school_attendance_records (learner_id);
create index if not exists school_attendance_records_status_idx
  on public.school_attendance_records (school_id, status);

create table if not exists public.school_attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.school_attendance_records (id) on delete cascade,
  school_id uuid not null,
  changed_by uuid references public.profiles (id) on delete set null,
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists school_attendance_corrections_record_idx
  on public.school_attendance_corrections (record_id);

-- Lien absence → record d'émargement (source)
alter table public.school_absences
  add column if not exists attendance_record_id uuid references public.school_attendance_records (id) on delete set null,
  add column if not exists source text not null default 'manual';

do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'school_absences' and constraint_name = 'school_absences_source_chk'
  ) then
    alter table public.school_absences
      add constraint school_absences_source_chk
      check (source in ('manual', 'attendance_auto', 'attendance_corrected'));
  end if;
exception when others then
  -- contrainte déjà présente ou schéma partiel
  null;
end $$;

comment on table public.school_curricula is
  'Cursus présentiels / hybrides école (distincts des formations EDGE Online).';
comment on table public.school_attendance_sessions is
  'Session d''émargement liée 1:1 à un créneau school_planning_slots.';
comment on table public.school_attendance_records is
  'Présence riche (présent / retard / départ anticipé / partiel / absent / incomplet).';

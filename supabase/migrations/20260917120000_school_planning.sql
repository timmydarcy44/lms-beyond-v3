-- Planning pédagogique école / apprenant EDGE
-- Source de vérité : créneaux école → lecture apprenant via class_enrollments.

create extension if not exists pgcrypto;

-- Années scolaires
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  label text not null,
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_years_school_id_idx on public.school_years (school_id);
create unique index if not exists school_years_school_label_uidx on public.school_years (school_id, label);

-- Enrichissement classes
alter table public.school_classes
  add column if not exists promotion text,
  add column if not exists school_year_id uuid references public.school_years (id) on delete set null;

create index if not exists school_classes_school_year_id_idx on public.school_classes (school_year_id);

-- Modules / matières planifiables (volume contractuel figé)
create table if not exists public.school_planning_modules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  school_year_id uuid references public.school_years (id) on delete set null,
  class_id uuid references public.school_classes (id) on delete cascade,
  name text not null,
  code text,
  planned_hours_total numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_planning_modules_hours_nonneg check (planned_hours_total >= 0)
);

create index if not exists school_planning_modules_school_id_idx on public.school_planning_modules (school_id);
create index if not exists school_planning_modules_class_id_idx on public.school_planning_modules (class_id);

-- Salles (optionnel)
create table if not exists public.school_rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  name text not null,
  capacity integer,
  created_at timestamptz not null default now()
);

create index if not exists school_rooms_school_id_idx on public.school_rooms (school_id);

-- Formateurs pouvant enseigner un module
create table if not exists public.school_module_instructors (
  module_id uuid not null references public.school_planning_modules (id) on delete cascade,
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (module_id, instructor_id)
);

-- Créneaux
create table if not exists public.school_planning_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  school_year_id uuid references public.school_years (id) on delete set null,
  class_id uuid not null references public.school_classes (id) on delete cascade,
  module_id uuid not null references public.school_planning_modules (id) on delete restrict,
  instructor_id uuid references public.profiles (id) on delete set null,
  room_id uuid references public.school_rooms (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_hours numeric(8,2) not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_planning_slots_range check (ends_at > starts_at),
  constraint school_planning_slots_duration_pos check (duration_hours > 0),
  constraint school_planning_slots_status_chk check (status in ('scheduled', 'cancelled', 'done'))
);

create index if not exists school_planning_slots_school_id_idx on public.school_planning_slots (school_id);
create index if not exists school_planning_slots_class_id_idx on public.school_planning_slots (class_id);
create index if not exists school_planning_slots_module_id_idx on public.school_planning_slots (module_id);
create index if not exists school_planning_slots_instructor_id_idx on public.school_planning_slots (instructor_id);
create index if not exists school_planning_slots_starts_at_idx on public.school_planning_slots (starts_at);

comment on table public.school_planning_modules is
  'Volumes pédagogiques contractuels (planned_hours_total immuable côté métier). heures planifiées = somme slots.';
comment on table public.school_planning_slots is
  'Créneaux emploi du temps école — source pour le planning apprenant.';

-- Seed année courante optionnelle (idempotent via unique school_id+label) : non automatique sans school_id.

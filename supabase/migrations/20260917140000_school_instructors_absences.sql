-- Formateurs école, candidatures, invitations + absences liées aux créneaux planning.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Formateurs (fiche pédagogique distincte des candidats)
-- ---------------------------------------------------------------------------
create table if not exists public.school_instructors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  profile_id uuid references public.profiles (id) on delete set null,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  photo_url text,
  address text,
  expertise text[] not null default '{}',
  teachable_subjects text[] not null default '{}',
  status text not null default 'incomplete',
  availability jsonb not null default '{}'::jsonb,
  job_title text,
  company text,
  bio text,
  linkedin_url text,
  pedagogical_experience text,
  levels text[] not null default '{}',
  internal_notes text,
  invited_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_instructors_status_chk check (
    status in ('active', 'invited', 'incomplete', 'inactive')
  )
);

create unique index if not exists school_instructors_school_email_uidx
  on public.school_instructors (school_id, lower(email));
create index if not exists school_instructors_school_id_idx
  on public.school_instructors (school_id);
create index if not exists school_instructors_profile_id_idx
  on public.school_instructors (profile_id);
create index if not exists school_instructors_status_idx
  on public.school_instructors (school_id, status);

-- Invitations (token hashé, expiration / renouvellement)
create table if not exists public.school_instructor_invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  instructor_id uuid not null references public.school_instructors (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists school_instructor_invitations_token_uidx
  on public.school_instructor_invitations (token_hash);
create index if not exists school_instructor_invitations_instructor_idx
  on public.school_instructor_invitations (instructor_id);

-- Candidats formateurs (pipeline séparé)
create table if not exists public.school_instructor_candidates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  expertise text[] not null default '{}',
  availability text,
  experience text,
  cv_url text,
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'new',
  internal_notes text,
  applied_at timestamptz not null default now(),
  converted_instructor_id uuid references public.school_instructors (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_instructor_candidates_status_chk check (
    status in ('new', 'review', 'contact', 'interview', 'retained', 'refused')
  )
);

create index if not exists school_instructor_candidates_school_id_idx
  on public.school_instructor_candidates (school_id);
create index if not exists school_instructor_candidates_status_idx
  on public.school_instructor_candidates (school_id, status);

-- Créneaux : formateur = fiche school_instructors (plus profiles)
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'school_planning_slots'
      and constraint_name = 'school_planning_slots_instructor_id_fkey'
  ) then
    alter table public.school_planning_slots
      drop constraint school_planning_slots_instructor_id_fkey;
  end if;
end $$;

alter table public.school_planning_slots
  add constraint school_planning_slots_instructor_id_fkey
  foreign key (instructor_id) references public.school_instructors (id) on delete set null;

do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'school_module_instructors'
      and constraint_name = 'school_module_instructors_instructor_id_fkey'
  ) then
    alter table public.school_module_instructors
      drop constraint school_module_instructors_instructor_id_fkey;
  end if;
end $$;

alter table public.school_module_instructors
  add constraint school_module_instructors_instructor_id_fkey
  foreign key (instructor_id) references public.school_instructors (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Absences liées aux créneaux (source de vérité = planning)
-- ---------------------------------------------------------------------------
create table if not exists public.school_absences (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  slot_id uuid not null references public.school_planning_slots (id) on delete cascade,
  learner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'full',
  duration_hours numeric(8,2) not null,
  status text not null default 'to_justify',
  motif text,
  proof_path text,
  proof_filename text,
  proof_mime text,
  proof_size integer,
  admin_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_absences_kind_chk check (
    kind in ('full', 'late', 'early_leave', 'partial')
  ),
  constraint school_absences_status_chk check (
    status in ('to_justify', 'proof_sent', 'justified', 'refused')
  ),
  constraint school_absences_duration_pos check (duration_hours > 0),
  constraint school_absences_slot_learner_uidx unique (slot_id, learner_id)
);

create index if not exists school_absences_school_id_idx on public.school_absences (school_id);
create index if not exists school_absences_learner_id_idx on public.school_absences (learner_id);
create index if not exists school_absences_slot_id_idx on public.school_absences (slot_id);
create index if not exists school_absences_status_idx on public.school_absences (school_id, status);

create table if not exists public.school_absence_status_history (
  id uuid primary key default gen_random_uuid(),
  absence_id uuid not null references public.school_absences (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists school_absence_status_history_absence_idx
  on public.school_absence_status_history (absence_id);

comment on table public.school_instructors is
  'Intervenants pédagogiques école — source pour le sélecteur formateur du planning.';
comment on table public.school_absences is
  'Absences apprenants rattachées à un créneau school_planning_slots.';

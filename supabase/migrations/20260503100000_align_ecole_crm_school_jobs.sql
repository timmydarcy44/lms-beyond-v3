-- Alignement BDD ↔ front Beyond Connect école (CRM, classes, offres, candidatures).
-- Tables attendues par : dashboard/ecole/*, prospection, pilotage handicap (crm_prospects),
-- school-apprenants (school_students, crm_prospects), matching apprenant (job_offers lecture).
--
-- Prérequis : public.profiles, extension pgcrypto (gen_random_uuid).
-- school_id doit exister avant les policies RLS (cette migration tourne avant 20260503103000).

create extension if not exists pgcrypto;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    alter table public.profiles add column if not exists school_id uuid;
  end if;
end $$;

create index if not exists profiles_school_id_idx on public.profiles (school_id);

-- ---------------------------------------------------------------------------
-- Classes & rattachements
-- ---------------------------------------------------------------------------
create table if not exists public.school_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  name text not null,
  npc_amount numeric,
  student_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_classes_school_id_idx on public.school_classes (school_id);

create table if not exists public.class_enrollments (
  class_id uuid not null references public.school_classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index if not exists class_enrollments_student_id_idx on public.class_enrollments (student_id);

create table if not exists public.school_students (
  school_id uuid not null,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (school_id, student_id)
);

create index if not exists school_students_school_id_idx on public.school_students (school_id);
create index if not exists school_students_student_id_idx on public.school_students (student_id);

-- ---------------------------------------------------------------------------
-- CRM prospection (SIRET, kanban, lien classes)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_prospects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  name text,
  company_name text,
  siret text,
  siren text,
  naf_code text,
  naf_ape text,
  sector text,
  opco text,
  opco_name text,
  address text,
  city text,
  zip_code text,
  tranche_effectif text,
  idcc_code text,
  creation_date text,
  amount numeric default 0,
  npc_value numeric default 0,
  step text default 'Prospect',
  company_status text default 'prospect',
  cursus text,
  positions integer default 1,
  hot boolean default false,
  is_signed boolean default false,
  target_class_id uuid references public.school_classes (id) on delete set null,
  contact_firstname text,
  contact_lastname text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_prospects_school_id_idx on public.crm_prospects (school_id);

-- Upsert côté front : onConflict: "siret" (index unique non partiel = compatible PostgREST / Supabase)
-- Plusieurs lignes avec siret NULL sont autorisées (NULL « distinct » en UNIQUE PostgreSQL).
create unique index if not exists crm_prospects_siret_unique_idx on public.crm_prospects (siret);

-- ---------------------------------------------------------------------------
-- Fiche handicap liée à une carte CRM (le front envoie selectedCard.id = crm_prospects.id)
-- ---------------------------------------------------------------------------
create table if not exists public.student_handicap_data (
  student_id uuid primary key references public.crm_prospects (id) on delete cascade,
  accommodation_type text,
  extra_time_duration text,
  justification_files jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.student_handicap_data is
  'Données handicap prospection : student_id référence crm_prospects.id (nom historique côté front).';

-- ---------------------------------------------------------------------------
-- Offres & candidatures (dashboard école + matching apprenant)
-- beyond_connect_job_offers reste distinct ; ce sont des tables "école / vivier".
-- ---------------------------------------------------------------------------
create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid,
  title text not null default '',
  city text,
  salary text,
  salary_range text,
  contract_type text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_offers_school_id_idx on public.job_offers (school_id);
create index if not exists job_offers_status_idx on public.job_offers (status);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_offers (id) on delete cascade,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  status text default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_talent_id_idx on public.applications (talent_id);
create index if not exists applications_job_id_idx on public.applications (job_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.school_classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.school_students enable row level security;
alter table public.crm_prospects enable row level security;
alter table public.student_handicap_data enable row level security;
alter table public.job_offers enable row level security;
alter table public.applications enable row level security;

-- Helper : même établissement que l'utilisateur connecté
-- school_classes
drop policy if exists "school_classes_same_school" on public.school_classes;
create policy "school_classes_same_school"
  on public.school_classes
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and p.school_id = school_classes.school_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and p.school_id = school_classes.school_id
    )
  );

-- class_enrollments (via classe)
drop policy if exists "class_enrollments_same_school" on public.class_enrollments;
create policy "class_enrollments_same_school"
  on public.class_enrollments
  for all
  using (
    exists (
      select 1
      from public.school_classes sc
      join public.profiles p on p.school_id = sc.school_id and p.id = auth.uid()
      where sc.id = class_enrollments.class_id
    )
  )
  with check (
    exists (
      select 1
      from public.school_classes sc
      join public.profiles p on p.school_id = sc.school_id and p.id = auth.uid()
      where sc.id = class_enrollments.class_id
    )
  );

-- school_students
drop policy if exists "school_students_same_school" on public.school_students;
create policy "school_students_same_school"
  on public.school_students
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and p.school_id = school_students.school_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and p.school_id = school_students.school_id
    )
  );

-- crm_prospects
drop policy if exists "crm_prospects_same_school" on public.crm_prospects;
create policy "crm_prospects_same_school"
  on public.crm_prospects
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and p.school_id = crm_prospects.school_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and p.school_id = crm_prospects.school_id
    )
  );

-- student_handicap_data : même école que le prospect
drop policy if exists "student_handicap_same_school" on public.student_handicap_data;
create policy "student_handicap_same_school"
  on public.student_handicap_data
  for all
  using (
    exists (
      select 1
      from public.crm_prospects c
      join public.profiles p on p.school_id = c.school_id and p.id = auth.uid()
      where c.id = student_handicap_data.student_id
    )
  )
  with check (
    exists (
      select 1
      from public.crm_prospects c
      join public.profiles p on p.school_id = c.school_id and p.id = auth.uid()
      where c.id = student_handicap_data.student_id
    )
  );

-- job_offers : lecture publique des offres actives (matching) ; gestion par l'école propriétaire
drop policy if exists "job_offers_select_active_or_school" on public.job_offers;
create policy "job_offers_select_active_or_school"
  on public.job_offers
  for select
  using (
    status = 'active'
    or (
      school_id is not null
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.school_id is not null
          and p.school_id = job_offers.school_id
      )
    )
  );

drop policy if exists "job_offers_modify_school" on public.job_offers;
create policy "job_offers_modify_school"
  on public.job_offers
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and job_offers.school_id is not null
        and p.school_id = job_offers.school_id
    )
  );

drop policy if exists "job_offers_update_school" on public.job_offers;
create policy "job_offers_update_school"
  on public.job_offers
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and job_offers.school_id is not null
        and p.school_id = job_offers.school_id
    )
  );

drop policy if exists "job_offers_delete_school" on public.job_offers;
create policy "job_offers_delete_school"
  on public.job_offers
  for delete
  using (
    school_id is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id is not null
        and p.school_id = job_offers.school_id
    )
  );

-- applications : le talent voit les siennes ; l'école voit celles sur ses offres
drop policy if exists "applications_talent_select" on public.applications;
create policy "applications_talent_select"
  on public.applications
  for select
  using (talent_id = auth.uid());

drop policy if exists "applications_school_select" on public.applications;
create policy "applications_school_select"
  on public.applications
  for select
  using (
    exists (
      select 1
      from public.job_offers jo
      join public.profiles p on p.school_id = jo.school_id and p.id = auth.uid()
      where jo.id = applications.job_id
    )
  );

drop policy if exists "applications_talent_insert" on public.applications;
create policy "applications_talent_insert"
  on public.applications
  for insert
  with check (talent_id = auth.uid());

drop policy if exists "applications_talent_update" on public.applications;
create policy "applications_talent_update"
  on public.applications
  for update
  using (talent_id = auth.uid());

-- Patients cabinet Jessica (export Doctolib / gestion cabinet)
-- Complète le CRM LMS : tous les patients n'ont pas forcément de compte plateforme.

create table if not exists public.jessica_cabinet_patients (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  gender text check (gender in ('m', 'f', 'o', 'unknown')),
  last_name text,
  first_name text,
  email text,
  email_secondary text,
  birth_date date,
  phone text,
  phone_secondary text,
  address text,
  city text,
  postal_code text,
  country text default 'fr',
  notes text,
  anamnesis text,
  communication_notes text,
  past_appointments_count integer not null default 0,
  last_appointment_at timestamptz,
  future_appointments_count integer not null default 0,
  next_appointment_at timestamptz,
  pro_cancellations_count integer not null default 0,
  patient_cancellations_count integer not null default 0,
  no_show_count integer not null default 0,
  last_appointment_location text,
  last_appointment_reason text,
  source_created_at timestamptz,
  raw_import jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jessica_cabinet_patients_external_id_key unique (external_id)
);

create index if not exists jessica_cabinet_patients_email_idx
  on public.jessica_cabinet_patients (lower(email));

create index if not exists jessica_cabinet_patients_name_idx
  on public.jessica_cabinet_patients (lower(last_name), lower(first_name));

create index if not exists jessica_cabinet_patients_profile_idx
  on public.jessica_cabinet_patients (profile_id)
  where profile_id is not null;

create index if not exists jessica_cabinet_patients_next_appt_idx
  on public.jessica_cabinet_patients (next_appointment_at desc nulls last);

comment on table public.jessica_cabinet_patients is
  'Base patients cabinet Jessica Contentin (Doctolib). Distinct des comptes LMS profiles.';

alter table public.jessica_cabinet_patients enable row level security;

drop policy if exists jessica_cabinet_patients_super_admin_all on public.jessica_cabinet_patients;
create policy jessica_cabinet_patients_super_admin_all on public.jessica_cabinet_patients
  for all to authenticated
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

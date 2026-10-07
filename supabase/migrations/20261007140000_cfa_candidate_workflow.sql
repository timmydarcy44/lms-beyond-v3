create table if not exists public.cfa_applications (
  id uuid primary key default gen_random_uuid(),
  resume_token uuid not null default gen_random_uuid() unique,
  status text not null default 'profile',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  age integer,
  education_level text,
  specialization text not null,
  challenge_answers jsonb not null default '{}'::jsonb,
  challenge_completed_at timestamptz,
  school_background text,
  experiences text,
  cv_path text,
  motivation_text text,
  motivation_media_url text,
  alternance_status text,
  interview_notes text,
  interview_at timestamptz,
  admission_decision_notes text,
  admitted_at timestamptz,
  financing_path text,
  career_center_activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cfa_applications_status_check check (
    status in ('profile', 'challenge', 'dossier', 'interview', 'review', 'admitted', 'rejected')
  ),
  constraint cfa_applications_specialization_check check (
    specialization in ('ai_business', 'sport_business', 'real_estate')
  ),
  constraint cfa_applications_age_check check (age is null or age between 15 and 99),
  constraint cfa_applications_alternance_check check (
    alternance_status is null or alternance_status in ('company_found', 'searching')
  ),
  constraint cfa_applications_financing_check check (
    financing_path is null or financing_path in ('alternance', 'byound_start')
  )
);

create unique index if not exists cfa_applications_email_active_unique
  on public.cfa_applications (lower(email))
  where status not in ('rejected');

create index if not exists cfa_applications_status_created_idx
  on public.cfa_applications (status, created_at desc);

create index if not exists cfa_applications_specialization_idx
  on public.cfa_applications (specialization);

create or replace function public.update_cfa_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cfa_applications_updated_at on public.cfa_applications;
create trigger cfa_applications_updated_at
  before update on public.cfa_applications
  for each row execute function public.update_cfa_applications_updated_at();

alter table public.cfa_applications enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cfa-applications',
  'cfa-applications',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg', 'audio/mp4', 'audio/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.cfa_applications is
  'Candidatures Byound School : profil, challenge, dossier, entretien, admission et financement.';

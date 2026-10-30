-- Candidature à une offre publique : brouillon, envoi, relances.
-- À coller dans l'éditeur SQL Supabase. Rejouable.
-- Ne modifie pas les candidatures déjà envoyées.

begin;

alter table public.applications
  add column if not exists submitted_at timestamptz,
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists cv_path text,
  add column if not exists pitch text,
  add column if not exists share_soft boolean not null default true,
  add column if not exists share_disc boolean not null default true,
  add column if not exists share_idmc boolean not null default false,
  add column if not exists reminders_opt_out boolean not null default false,
  add column if not exists reminder_1_at timestamptz,
  add column if not exists reminder_3_at timestamptz,
  add column if not exists reminder_7_at timestamptz,
  add column if not exists closed_reason text;

create unique index if not exists applications_open_talent_job_idx
  on public.applications (talent_id, job_id)
  where status in ('draft', 'submitted');

alter table public.cfa_applications
  add column if not exists job_offer_id uuid references public.job_offers (id) on delete set null,
  add column if not exists birth_date date;

alter table public.signup_requests
  add column if not exists offer_slug text;

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  offer_slug text,
  created_at timestamptz not null default now()
);

create index if not exists product_events_name_created_idx
  on public.product_events (name, created_at desc);

alter table public.product_events enable row level security;
revoke all on public.product_events from anon, authenticated;
grant select, insert, update, delete on public.product_events to service_role;

commit;

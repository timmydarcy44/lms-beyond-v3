-- Signaux formation, LMS et RH pour le pipeline Business. Aucun contact n'est envoyé.
-- À coller dans l'éditeur SQL Supabase.

begin;

create table if not exists public.biz_signal_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  found_count integer not null default 0,
  error text
);

create table if not exists public.biz_signal_leads (
  id uuid primary key default gen_random_uuid(),
  siret text not null unique,
  company_name text not null,
  city text,
  postal_code text,
  naf_code text,
  signal_kind text not null,
  reason text,
  source_url text,
  status text not null default 'pending',
  deal_id uuid,
  created_at timestamptz not null default now(),
  constraint biz_signal_leads_status_check check (status in ('pending', 'accepted', 'dismissed')),
  constraint biz_signal_leads_kind_check check (signal_kind in ('formation', 'lms', 'rh'))
);

create index if not exists biz_signal_leads_status_idx on public.biz_signal_leads (status, created_at desc);

alter table public.biz_signal_runs enable row level security;
alter table public.biz_signal_leads enable row level security;

commit;

-- Pistes de l'agent Business Dev. Aucun contact n'est envoyé.
-- À coller dans l'éditeur SQL Supabase.

begin;

create table if not exists public.cfa_bd_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  found_count integer not null default 0,
  error text
);

create table if not exists public.cfa_bd_leads (
  id uuid primary key default gen_random_uuid(),
  siret text not null unique,
  company_name text not null,
  city text,
  postal_code text,
  address_line text,
  naf_code text,
  naf_label text,
  headcount_range text,
  idcc text,
  cursus_id text,
  reason text,
  territory text not null default 'france',
  model text,
  source_url text,
  mentions_title boolean not null default false,
  status text not null default 'pending',
  company_id uuid,
  created_at timestamptz not null default now(),
  constraint cfa_bd_leads_status_check check (status in ('pending', 'accepted', 'dismissed')),
  constraint cfa_bd_leads_territory_check check (territory in ('normandie', 'idf', 'france'))
);

alter table public.cfa_bd_leads add column if not exists source_url text;
alter table public.cfa_bd_leads add column if not exists mentions_title boolean not null default false;

create index if not exists cfa_bd_leads_status_idx on public.cfa_bd_leads (status, created_at desc);

alter table public.cfa_bd_runs enable row level security;
alter table public.cfa_bd_leads enable row level security;

commit;

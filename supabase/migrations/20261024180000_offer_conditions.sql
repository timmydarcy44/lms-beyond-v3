-- Conditions d'une offre. Aucun montant légal n'est inséré ici.

alter table public.job_offers
  add column if not exists salary_min integer,
  add column if not exists salary_max integer,
  add column if not exists salary_period text,
  add column if not exists hours_per_week numeric,
  add column if not exists start_label text,
  add column if not exists headcount integer,
  add column if not exists benefits jsonb not null default '[]'::jsonb;

create table if not exists public.alternance_salary_grid (
  id uuid primary key default gen_random_uuid(),
  updated_on date not null default current_date,
  min_cents integer not null,
  period text not null default 'month' check (period in ('month', 'year')),
  note text
);

comment on table public.alternance_salary_grid is
  'Minimum le plus bas de la grille d alternance, tenu en base. L application ne code aucun montant.';

alter table public.alternance_salary_grid enable row level security;

-- Leads tunnel d'orientation EDGE (/votre-orientation)
create table if not exists public.edge_orientation_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  employment_status text not null,
  objectifs jsonb default '[]'::jsonb,
  profil text,
  format text,
  result_payload jsonb,
  source text default 'votre-orientation',
  created_at timestamptz not null default now()
);

create index if not exists edge_orientation_leads_email_idx on public.edge_orientation_leads (email);
create index if not exists edge_orientation_leads_created_at_idx on public.edge_orientation_leads (created_at desc);

alter table public.edge_orientation_leads enable row level security;

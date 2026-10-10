create table if not exists public.cfa_program_downloads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  specialization text not null,
  created_at timestamptz not null default now()
);

create index if not exists cfa_program_downloads_created_idx
  on public.cfa_program_downloads (created_at desc);

alter table public.cfa_program_downloads enable row level security;

grant all on public.cfa_program_downloads to service_role;

comment on table public.cfa_program_downloads is
  'Coordonnées laissées pour télécharger la fiche PDF d’un cursus Byound School.';

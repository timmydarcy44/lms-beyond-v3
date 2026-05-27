-- CRM sales pipeline (Pipedrive-style) + stage labels editable

create table if not exists public.crm_pipeline_stages (
  slug text primary key,
  label text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_pipeline_deals (
  id uuid primary key default gen_random_uuid(),
  stage_slug text not null references public.crm_pipeline_stages (slug) on update cascade,
  company_name text not null default '',
  contact_first_name text not null default '',
  email text,
  phone text,
  amount_cents int not null default 0,
  sort_order int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_pipeline_deals_stage_idx on public.crm_pipeline_deals (stage_slug, sort_order);

insert into public.crm_pipeline_stages (slug, label, sort_order) values
  ('a_appeler', 'A appeler', 0),
  ('envoi_mail', 'Envoi mail', 1),
  ('presentation_programmee', 'Présentation programmé', 2),
  ('demo_realisee', 'Demo réalisé', 3),
  ('proposition_a_faire', 'Proposition à faire', 4),
  ('proposition_envoyee', 'Proposition envoyé', 5),
  ('reussi', 'Réussi', 6),
  ('echec', 'Échec', 7)
on conflict (slug) do nothing;

alter table public.crm_pipeline_stages enable row level security;
alter table public.crm_pipeline_deals enable row level security;

drop policy if exists crm_pipeline_stages_super on public.crm_pipeline_stages;
create policy crm_pipeline_stages_super on public.crm_pipeline_stages
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists crm_pipeline_deals_super on public.crm_pipeline_deals;
create policy crm_pipeline_deals_super on public.crm_pipeline_deals
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

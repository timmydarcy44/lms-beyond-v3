-- Espace expert : visibilité du profil, créneaux, avis.
-- Les documents déjà déposés restent dans experts.references.
-- Collez ce script dans Supabase.

alter table public.experts add column if not exists visibility jsonb not null default '{}'::jsonb;

create table if not exists public.expert_slots (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  format text not null default 'visio' check (format in ('visio', 'presentiel')),
  location text,
  mission_id uuid,
  recurrence_rule text,
  created_at timestamptz not null default now()
);

create table if not exists public.expert_reviews (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  client_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  mission_label text,
  created_at timestamptz not null default now()
);

create table if not exists public.expert_documents (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  name text not null,
  folder text not null default 'autre' check (folder in ('contrat', 'cv', 'attestation', 'autre')),
  status text not null default 'deposited' check (status in ('to_sign', 'signed', 'deposited')),
  url text,
  pages integer,
  expires_at date,
  uploaded_at timestamptz not null default now()
);

alter table public.expert_slots enable row level security;
alter table public.expert_reviews enable row level security;
alter table public.expert_documents enable row level security;

drop policy if exists expert_slots_own on public.expert_slots;
create policy expert_slots_own on public.expert_slots
  for all using (expert_id = auth.uid()) with check (expert_id = auth.uid());

drop policy if exists expert_reviews_read on public.expert_reviews;
create policy expert_reviews_read on public.expert_reviews
  for select using (expert_id = auth.uid());

drop policy if exists expert_documents_own on public.expert_documents;
create policy expert_documents_own on public.expert_documents
  for all using (expert_id = auth.uid()) with check (expert_id = auth.uid());

-- Suggestions de compétences hors catalogue, ajouts admin et alias.
-- Réversible : le down supprime ces tables, pas les compétences déjà déclarées.

create table if not exists public.skill_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'added', 'merged')),
  merged_into text,
  created_at timestamptz not null default now()
);

create index if not exists skill_suggestions_label_idx
  on public.skill_suggestions (lower(label), created_at desc);

create table if not exists public.skill_catalog_additions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null default 'Autre',
  created_at timestamptz not null default now(),
  constraint skill_catalog_additions_label_unique unique (label)
);

create table if not exists public.skill_catalog_aliases (
  alias text primary key,
  canonical text not null,
  created_at timestamptz not null default now()
);

alter table public.skill_suggestions enable row level security;
alter table public.skill_catalog_additions enable row level security;
alter table public.skill_catalog_aliases enable row level security;

drop policy if exists skill_suggestions_insert_own on public.skill_suggestions;
create policy skill_suggestions_insert_own
  on public.skill_suggestions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists skill_suggestions_select_own on public.skill_suggestions;
create policy skill_suggestions_select_own
  on public.skill_suggestions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists skill_catalog_additions_read on public.skill_catalog_additions;
create policy skill_catalog_additions_read
  on public.skill_catalog_additions
  for select
  to authenticated
  using (true);

drop policy if exists skill_catalog_aliases_read on public.skill_catalog_aliases;
create policy skill_catalog_aliases_read
  on public.skill_catalog_aliases
  for select
  to authenticated
  using (true);

comment on table public.skill_suggestions is
  'Compétences saisies librement. Non publiées dans le catalogue tant qu un admin ne les ajoute pas.';

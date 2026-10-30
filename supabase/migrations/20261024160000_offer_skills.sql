-- Compétences d'une offre. Les ajouts hors catalogue restent liés à l'entreprise.

create table if not exists public.offer_skill_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  label text not null,
  kind text not null default 'hard' check (kind in ('soft', 'hard')),
  catalog_key text,
  pending_review boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists offer_skill_items_org_key_idx
  on public.offer_skill_items (organization_id, catalog_key)
  where catalog_key is not null;

create table if not exists public.offer_skills (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.job_offers (id) on delete cascade,
  skill_id uuid not null references public.offer_skill_items (id) on delete cascade,
  importance text not null default 'preferred' check (importance in ('required', 'preferred')),
  position integer not null default 0,
  unique (offer_id, skill_id)
);

create index if not exists offer_skills_offer_id_idx on public.offer_skills (offer_id, position);

alter table public.offer_skill_items enable row level security;
alter table public.offer_skills enable row level security;

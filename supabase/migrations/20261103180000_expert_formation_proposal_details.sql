-- Crée la table si elle n'existe pas, puis ajoute les colonnes de détail.

begin;

create table if not exists public.expert_formation_proposals (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts (id) on delete cascade,
  title text not null,
  presentation text,
  objectives text not null,
  prerequisites text not null,
  audience text not null,
  content text,
  price_eur integer,
  formats text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.expert_formation_proposals
  add column if not exists presentation text,
  add column if not exists content text,
  add column if not exists price_eur integer,
  add column if not exists formats text[] not null default '{}';

create index if not exists expert_formation_proposals_status_idx
  on public.expert_formation_proposals (status, created_at desc);

create index if not exists expert_formation_proposals_expert_idx
  on public.expert_formation_proposals (expert_id, created_at desc);

alter table public.expert_formation_proposals enable row level security;

commit;

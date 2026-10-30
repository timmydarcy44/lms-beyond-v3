-- Propositions de formation envoyées par un expert, à valider dans /super.

begin;

create table if not exists public.expert_formation_proposals (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts (id) on delete cascade,
  title text not null,
  objectives text not null,
  prerequisites text not null,
  audience text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists expert_formation_proposals_status_idx
  on public.expert_formation_proposals (status, created_at desc);

alter table public.expert_formation_proposals enable row level security;

commit;

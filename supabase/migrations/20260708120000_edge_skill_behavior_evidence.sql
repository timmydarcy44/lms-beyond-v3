-- Dossier de preuves comportementales EDGE (matrice progressive par compétence).

create table if not exists public.edge_skill_behavior_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_slug text not null,
  skill_name text not null,
  behavior_key text not null,
  behavior_label text not null,
  observations jsonb not null default '[]'::jsonb,
  mission_contexts text[] not null default '{}',
  observation_count integer not null default 0 check (observation_count >= 0),
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_slug, behavior_key)
);

create index if not exists edge_skill_behavior_evidence_user_skill_idx
  on public.edge_skill_behavior_evidence (user_id, skill_slug);

alter table public.edge_skill_behavior_evidence enable row level security;

create policy "edge_skill_behavior_evidence_select_own"
  on public.edge_skill_behavior_evidence for select
  using (auth.uid() = user_id);

create policy "edge_skill_behavior_evidence_insert_own"
  on public.edge_skill_behavior_evidence for insert
  with check (auth.uid() = user_id);

create policy "edge_skill_behavior_evidence_update_own"
  on public.edge_skill_behavior_evidence for update
  using (auth.uid() = user_id);

-- Demandes de parcours personnalisé EDGE (approche concierge)

create table if not exists public.edge_personalized_path_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  objective text not null,
  current_status text not null,
  deadline text not null,
  support_preference text not null,
  message text,
  priority_skills text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'proposal_sent', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists edge_personalized_path_requests_user_id_idx
  on public.edge_personalized_path_requests (user_id);

create index if not exists edge_personalized_path_requests_status_idx
  on public.edge_personalized_path_requests (status);

alter table public.edge_personalized_path_requests enable row level security;

create policy "Users can insert own path requests"
  on public.edge_personalized_path_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can read own path requests"
  on public.edge_personalized_path_requests for select
  using (auth.uid() = user_id);

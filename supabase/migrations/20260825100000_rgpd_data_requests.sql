-- Demandes d'exercice des droits RGPD (accès / effacement / opposition / rectification)

create table if not exists public.rgpd_data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  request_type text not null
    check (request_type in ('access', 'erasure', 'rectification', 'opposition')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'fulfilled', 'rejected')),
  payload jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists rgpd_data_requests_user_idx
  on public.rgpd_data_requests (user_id, created_at desc);

create index if not exists rgpd_data_requests_status_idx
  on public.rgpd_data_requests (status, created_at desc);

alter table public.rgpd_data_requests enable row level security;

drop policy if exists rgpd_data_requests_select_own on public.rgpd_data_requests;
create policy rgpd_data_requests_select_own
  on public.rgpd_data_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists rgpd_data_requests_insert_own on public.rgpd_data_requests;
create policy rgpd_data_requests_insert_own
  on public.rgpd_data_requests
  for insert
  with check (auth.uid() = user_id);

comment on table public.rgpd_data_requests is
  'Demandes RGPD utilisateurs (accès, effacement, opposition, rectification).';

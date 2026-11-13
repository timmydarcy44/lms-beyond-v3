-- Gestion handicap référente : docs, besoins, plan, rendez-vous séquentiels

alter table public.handicap_profiles
  add column if not exists specific_needs text,
  add column if not exists accompaniment_plan text;

create table if not exists public.handicap_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.handicap_profiles (id) on delete cascade,
  kind text not null check (kind in ('rqth', 'autre')),
  title text not null,
  file_url text,
  file_name text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists handicap_documents_profile_idx
  on public.handicap_documents (profile_id, kind, created_at desc);

create table if not exists public.handicap_meetings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.handicap_profiles (id) on delete cascade,
  sequence_n integer not null check (sequence_n >= 1),
  status text not null default 'open' check (status in ('open', 'closed')),
  notes text,
  held_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, sequence_n)
);

create index if not exists handicap_meetings_profile_idx
  on public.handicap_meetings (profile_id, sequence_n);

alter table public.handicap_documents enable row level security;
alter table public.handicap_meetings enable row level security;

drop policy if exists handicap_documents_service on public.handicap_documents;
create policy handicap_documents_service on public.handicap_documents
  for all using (true) with check (true);

drop policy if exists handicap_meetings_service on public.handicap_meetings;
create policy handicap_meetings_service on public.handicap_meetings
  for all using (true) with check (true);

grant select, insert, update, delete on public.handicap_documents to authenticated;
grant select, insert, update, delete on public.handicap_meetings to authenticated;
grant all on public.handicap_documents to service_role;
grant all on public.handicap_meetings to service_role;

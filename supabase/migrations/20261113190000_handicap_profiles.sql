-- Espace Handicap sécurisé (référente) — profils RQTH Business + School

alter table public.employees
  add column if not exists rqth boolean not null default false,
  add column if not exists rqth_declared_at timestamptz,
  add column if not exists rqth_needs_summary text;

alter table public.formation_participants
  add column if not exists rqth boolean not null default false;

create table if not exists public.handicap_profiles (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('business', 'school')),
  source_kind text not null check (source_kind in ('employee', 'formation_participant', 'cfa_application')),
  source_id uuid not null,
  organization_id uuid,
  person_name text not null default '',
  person_email text,
  rqth boolean not null default true,
  active boolean not null default true,
  needs_summary text,
  accommodations jsonb not null default '[]'::jsonb,
  referent_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_kind, source_id)
);

create index if not exists handicap_profiles_scope_active_idx
  on public.handicap_profiles (scope, active, updated_at desc);

create index if not exists handicap_profiles_org_idx
  on public.handicap_profiles (organization_id);

create table if not exists public.handicap_followups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.handicap_profiles (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists handicap_followups_profile_idx
  on public.handicap_followups (profile_id, created_at desc);

alter table public.handicap_profiles enable row level security;
alter table public.handicap_followups enable row level security;

drop policy if exists handicap_profiles_service on public.handicap_profiles;
create policy handicap_profiles_service on public.handicap_profiles
  for all using (true) with check (true);

drop policy if exists handicap_followups_service on public.handicap_followups;
create policy handicap_followups_service on public.handicap_followups
  for all using (true) with check (true);

grant select, insert, update, delete on public.handicap_profiles to authenticated;
grant select, insert, update, delete on public.handicap_followups to authenticated;
grant all on public.handicap_profiles to service_role;
grant all on public.handicap_followups to service_role;

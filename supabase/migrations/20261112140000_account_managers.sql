-- Annuaire des gestionnaires / chargés de compte (assignables sur les organisations).

create table if not exists public.account_managers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  photo_url text,
  is_active boolean not null default true,
  profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_managers_email_format check (position('@' in email) > 1)
);

create unique index if not exists account_managers_email_uidx
  on public.account_managers (lower(email));

create index if not exists account_managers_active_idx
  on public.account_managers (is_active, last_name, first_name);

-- Reprendre les profils déjà assignés comme chargés de compte (même id).
insert into public.account_managers (
  id, first_name, last_name, email, phone, photo_url, profile_id, is_active
)
select
  p.id,
  coalesce(nullif(split_part(trim(coalesce(p.full_name, p.email, 'Gestionnaire')), ' ', 1), ''), 'Gestionnaire'),
  coalesce(
    nullif(trim(regexp_replace(coalesce(p.full_name, ''), '^\S+\s*', '')), ''),
    'Compte'
  ),
  lower(trim(p.email)),
  nullif(trim(coalesce(p.phone, '')), ''),
  nullif(trim(coalesce(p.avatar_url, '')), ''),
  p.id,
  true
from public.profiles p
where p.id in (
  select distinct o.account_manager_id
  from public.organizations o
  where o.account_manager_id is not null
)
  and p.email is not null
  and position('@' in p.email) > 1
on conflict (id) do nothing;

-- Remplacer la FK profiles → account_managers
alter table public.organizations
  drop constraint if exists organizations_account_manager_id_fkey;

do $$
declare
  r record;
begin
  for r in
    select con.conname as name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'organizations'
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%account_manager_id%'
      and pg_get_constraintdef(con.oid) ilike '%profiles%'
  loop
    execute format('alter table public.organizations drop constraint %I', r.name);
  end loop;
end $$;

-- Nettoyer les IDs orphelins qui ne sont pas dans account_managers
update public.organizations o
set account_manager_id = null
where o.account_manager_id is not null
  and not exists (
    select 1 from public.account_managers am where am.id = o.account_manager_id
  );

alter table public.organizations
  add constraint organizations_account_manager_id_fkey
  foreign key (account_manager_id)
  references public.account_managers (id)
  on delete set null;

alter table public.account_managers enable row level security;

drop policy if exists account_managers_super_all on public.account_managers;
create policy account_managers_super_all
  on public.account_managers
  for all
  to authenticated
  using (
    exists (
      select 1 from public.super_admins s
      where s.user_id = auth.uid() and s.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.super_admins s
      where s.user_id = auth.uid() and s.is_active = true
    )
  );

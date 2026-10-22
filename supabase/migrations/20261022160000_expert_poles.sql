-- Pôles Formation / Care. À coller après 20261022150000.
-- Ne pas exécuter depuis l'app.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'expert_pole') then
    create type public.expert_pole as enum ('formation', 'care');
  end if;
  if not exists (select 1 from pg_type where typname = 'expert_membership_status') then
    create type public.expert_membership_status as enum ('active', 'pending', 'suspended');
  end if;
end $$;

create table if not exists public.expert_memberships (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts (id) on delete cascade,
  pole public.expert_pole not null,
  status public.expert_membership_status not null default 'pending',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expert_id, pole)
);

create table if not exists public.pole_managers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  pole public.expert_pole not null,
  created_at timestamptz not null default now(),
  primary key (user_id, pole)
);

insert into public.expert_memberships (expert_id, pole, status, joined_at)
select id, 'formation', 'active', now()
from public.experts
on conflict (expert_id, pole) do nothing;

insert into public.expert_memberships (expert_id, pole, status, joined_at)
select id, 'care', 'pending', null
from public.experts
where is_care_expert is true
on conflict (expert_id, pole) do nothing;

alter table public.action_requests
  add column if not exists pole public.expert_pole not null default 'formation';

create or replace function public.has_active_membership(p_expert_id uuid, p_pole public.expert_pole)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.expert_memberships m
    where m.expert_id = p_expert_id
      and m.pole = p_pole
      and m.status = 'active'
  );
$$;

create or replace function public.is_pole_manager(p_pole public.expert_pole)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pole_managers pm
    where pm.user_id = auth.uid()
      and pm.pole = p_pole
  );
$$;

revoke all on function public.has_active_membership(uuid, public.expert_pole) from public;
revoke all on function public.is_pole_manager(public.expert_pole) from public;
grant execute on function public.has_active_membership(uuid, public.expert_pole) to authenticated;
grant execute on function public.is_pole_manager(public.expert_pole) to authenticated;

create or replace function public.guard_action_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_status boolean;
begin
  if exists (
    select 1 from public.super_admins s
    where s.user_id = auth.uid() and s.is_active = true
  ) then
    return new;
  end if;

  paid_status := lower(coalesce(new.status, '')) in (
    'paid', 'paye', 'payee', 'payée', 'verse', 'versee', 'versée', 'versed'
  );

  if paid_status
     or new.id is distinct from old.id
     or new.expert_id is distinct from old.expert_id
     or new.requester_id is distinct from old.requester_id
     or new.company_id is distinct from old.company_id
     or new.pole is distinct from old.pole
     or new.metadata is distinct from old.metadata
     or new.action_type is distinct from old.action_type
     or new.target_label is distinct from old.target_label
     or new.target_count is distinct from old.target_count
     or new.created_at is distinct from old.created_at
     or new.initial_score is distinct from old.initial_score
     or new.final_score is distinct from old.final_score
     or new.impact_category is distinct from old.impact_category
  then
    raise exception 'action_requests: champ non modifiable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop policy if exists expert_view_own_missions on public.action_requests;
create policy expert_view_own_missions
  on public.action_requests
  for select
  to authenticated
  using (
    auth.uid() = expert_id
    and public.has_active_membership(auth.uid(), pole)
  );

drop policy if exists expert_update_own_missions on public.action_requests;
create policy expert_update_own_missions
  on public.action_requests
  for update
  to authenticated
  using (
    auth.uid() = expert_id
    and public.has_active_membership(auth.uid(), pole)
  )
  with check (
    auth.uid() = expert_id
    and public.has_active_membership(auth.uid(), pole)
  );

drop policy if exists pole_manager_select_missions on public.action_requests;
create policy pole_manager_select_missions
  on public.action_requests
  for select
  to authenticated
  using (public.is_pole_manager(pole));

drop policy if exists pole_manager_insert_missions on public.action_requests;
create policy pole_manager_insert_missions
  on public.action_requests
  for insert
  to authenticated
  with check (public.is_pole_manager(pole));

drop policy if exists pole_manager_update_missions on public.action_requests;
create policy pole_manager_update_missions
  on public.action_requests
  for update
  to authenticated
  using (public.is_pole_manager(pole))
  with check (public.is_pole_manager(pole));

alter table public.expert_memberships enable row level security;
alter table public.pole_managers enable row level security;

drop policy if exists memberships_select_own on public.expert_memberships;
create policy memberships_select_own
  on public.expert_memberships
  for select
  to authenticated
  using (expert_id = auth.uid());

drop policy if exists memberships_super_all on public.expert_memberships;
create policy memberships_super_all
  on public.expert_memberships
  for all
  to authenticated
  using (
    exists (select 1 from public.super_admins s where s.user_id = auth.uid() and s.is_active = true)
  )
  with check (
    exists (select 1 from public.super_admins s where s.user_id = auth.uid() and s.is_active = true)
  );

drop policy if exists memberships_manager_select on public.expert_memberships;
create policy memberships_manager_select
  on public.expert_memberships
  for select
  to authenticated
  using (public.is_pole_manager(pole));

drop policy if exists memberships_manager_insert on public.expert_memberships;
create policy memberships_manager_insert
  on public.expert_memberships
  for insert
  to authenticated
  with check (public.is_pole_manager(pole));

drop policy if exists memberships_manager_update on public.expert_memberships;
create policy memberships_manager_update
  on public.expert_memberships
  for update
  to authenticated
  using (public.is_pole_manager(pole))
  with check (public.is_pole_manager(pole));

drop policy if exists pole_managers_select_own on public.pole_managers;
create policy pole_managers_select_own
  on public.pole_managers
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists pole_managers_super_all on public.pole_managers;
create policy pole_managers_super_all
  on public.pole_managers
  for all
  to authenticated
  using (
    exists (select 1 from public.super_admins s where s.user_id = auth.uid() and s.is_active = true)
  )
  with check (
    exists (select 1 from public.super_admins s where s.user_id = auth.uid() and s.is_active = true)
  );

grant select, insert, update on public.expert_memberships to authenticated;
grant select, insert, update, delete on public.pole_managers to authenticated;

commit;

-- Retour arrière :
-- begin;
-- drop policy if exists pole_managers_super_all on public.pole_managers;
-- drop policy if exists pole_managers_select_own on public.pole_managers;
-- drop policy if exists memberships_manager_update on public.expert_memberships;
-- drop policy if exists memberships_manager_insert on public.expert_memberships;
-- drop policy if exists memberships_manager_select on public.expert_memberships;
-- drop policy if exists memberships_super_all on public.expert_memberships;
-- drop policy if exists memberships_select_own on public.expert_memberships;
-- drop policy if exists pole_manager_update_missions on public.action_requests;
-- drop policy if exists pole_manager_insert_missions on public.action_requests;
-- drop policy if exists pole_manager_select_missions on public.action_requests;
-- alter table public.action_requests drop column if exists pole;
-- drop table if exists public.pole_managers;
-- drop table if exists public.expert_memberships;
-- drop function if exists public.is_pole_manager(public.expert_pole);
-- drop function if exists public.has_active_membership(uuid, public.expert_pole);
-- drop type if exists public.expert_membership_status;
-- drop type if exists public.expert_pole;
-- recréer expert_view_own_missions (auth.uid() = expert_id)
-- et expert_update_own_missions comme dans 20261022140000
-- commit;

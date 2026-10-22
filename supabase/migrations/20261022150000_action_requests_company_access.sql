-- Entreprise : company_id existe déjà. Pas de colonne org_id.
-- Ne modifie pas employee_view_own_requests ni expert_view_own_missions.
-- À coller après 20261022140000. Ne pas exécuter depuis l'app.

begin;

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
    select 1
    from public.super_admins s
    where s.user_id = auth.uid()
      and s.is_active = true
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

create or replace function public.stamp_action_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.requester_id := auth.uid();
  end if;
  if new.company_id is null then
    raise exception 'action_requests: company_id requis'
      using errcode = '23502';
  end if;
  return new;
end;
$$;

revoke all on function public.stamp_action_request_insert() from public;
grant execute on function public.stamp_action_request_insert() to authenticated;

drop trigger if exists action_requests_stamp_insert on public.action_requests;
create trigger action_requests_stamp_insert
  before insert on public.action_requests
  for each row
  execute function public.stamp_action_request_insert();

drop policy if exists org_admin_select_company_requests on public.action_requests;
create policy org_admin_select_company_requests
  on public.action_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.user_id = auth.uid()
        and m.role = 'admin'
        and m.org_id = company_id
    )
  );

drop policy if exists org_admin_insert_company_requests on public.action_requests;
create policy org_admin_insert_company_requests
  on public.action_requests
  for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and exists (
      select 1
      from public.org_memberships m
      where m.user_id = auth.uid()
        and m.role = 'admin'
        and m.org_id = company_id
    )
  );

commit;

-- Retour arrière :
-- begin;
-- drop policy if exists org_admin_select_company_requests on public.action_requests;
-- drop policy if exists org_admin_insert_company_requests on public.action_requests;
-- drop trigger if exists action_requests_stamp_insert on public.action_requests;
-- drop function if exists public.stamp_action_request_insert();
-- puis recoller la fonction guard_action_request_update de 20261022140000
-- commit;

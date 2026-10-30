-- Complète les policies de public.action_requests.
-- Ne touche pas à employee_view_own_requests ni expert_view_own_missions.
-- Pas de policy entreprise : le code ne rattache pas la demande à une organisation
-- (pas de org_id / company_id). Le demandeur côté appli est dans metadata.
-- À coller dans Supabase après relecture. Ne pas exécuter depuis l'app.

begin;

create or replace function public.guard_action_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.super_admins s
    where s.user_id = auth.uid()
      and s.is_active = true
  ) then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.expert_id is distinct from old.expert_id
     or new.requester_id is distinct from old.requester_id
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

revoke all on function public.guard_action_request_update() from public;
grant execute on function public.guard_action_request_update() to authenticated;

drop trigger if exists action_requests_guard_update on public.action_requests;
create trigger action_requests_guard_update
  before update on public.action_requests
  for each row
  execute function public.guard_action_request_update();

drop policy if exists expert_update_own_missions on public.action_requests;
create policy expert_update_own_missions
  on public.action_requests
  for update
  to authenticated
  using (auth.uid() = expert_id)
  with check (auth.uid() = expert_id);

drop policy if exists super_admins_all_action_requests on public.action_requests;
create policy super_admins_all_action_requests
  on public.action_requests
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.super_admins s
      where s.user_id = auth.uid()
        and s.is_active = true
    )
  )
  with check (
    exists (
      select 1
      from public.super_admins s
      where s.user_id = auth.uid()
        and s.is_active = true
    )
  );

commit;

-- Retour arrière :
-- begin;
-- drop policy if exists expert_update_own_missions on public.action_requests;
-- drop policy if exists super_admins_all_action_requests on public.action_requests;
-- drop trigger if exists action_requests_guard_update on public.action_requests;
-- drop function if exists public.guard_action_request_update();
-- commit;

-- Complète 20261104220000, déjà appliquée. Ne la modifie pas.
-- Réaffirme search_path sur la fonction de lecture.
-- L'apprenant ne peut pas écrire ai_feedback ni version : seule la route
-- serveur, avec la clé service, le peut.

create or replace function public.can_read_course_workshop_outputs(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.super_admins sa
      where sa.user_id = auth.uid()
        and sa.is_active = true
    )
    or exists (
      select 1
      from public.courses c
      where c.id = p_course_id
        and (c.creator_id = auth.uid() or c.owner_id = auth.uid())
    )
    or exists (
      select 1
      from public.courses c
      join public.org_memberships m on m.org_id = c.org_id
      where c.id = p_course_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'instructor', 'formateur', 'tutor', 'owner', 'staff')
    );
$$;

revoke all on function public.can_read_course_workshop_outputs(uuid) from public;
grant execute on function public.can_read_course_workshop_outputs(uuid) to authenticated;

create or replace function public.guard_learner_workshop_outputs()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  next_version integer;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.ai_feedback := null;
    select coalesce(max(version), 0) + 1
      into next_version
      from public.learner_workshop_outputs
      where user_id = new.user_id
        and course_id = new.course_id
        and block_id = new.block_id;
    new.version := next_version;
    return new;
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new.course_id := old.course_id;
  new.block_id := old.block_id;
  new.version := old.version;
  new.ai_feedback := old.ai_feedback;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists learner_workshop_outputs_guard on public.learner_workshop_outputs;
create trigger learner_workshop_outputs_guard
  before insert or update on public.learner_workshop_outputs
  for each row
  execute function public.guard_learner_workshop_outputs();

revoke insert, update on public.learner_workshop_outputs from authenticated;
grant insert (
  id,
  user_id,
  course_id,
  block_id,
  answers,
  is_final,
  created_at,
  updated_at
) on public.learner_workshop_outputs to authenticated;
grant update (answers, is_final, updated_at)
  on public.learner_workshop_outputs to authenticated;

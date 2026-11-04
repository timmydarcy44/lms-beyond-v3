-- Réponses d'atelier. N'efface aucune table.
-- Le brouillon ouvert est la dernière version non finale : elle est mise à jour sur place.
-- Chaque amélioration ajoute une version. Une seule version finale par atelier.

create table if not exists public.learner_workshop_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  block_id text not null,
  version integer not null check (version >= 1 and version <= 20),
  answers jsonb not null default '{}'::jsonb,
  ai_feedback jsonb,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id, block_id, version)
);

create unique index if not exists learner_workshop_outputs_one_final
  on public.learner_workshop_outputs (user_id, course_id, block_id)
  where is_final = true;

create index if not exists learner_workshop_outputs_user_idx
  on public.learner_workshop_outputs (user_id, created_at desc);

comment on table public.learner_workshop_outputs is
  'Réponses d''atelier. Le brouillon a is_final = false. La validation fige une version.';

alter table public.learner_workshop_outputs enable row level security;

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

drop policy if exists learner_workshop_outputs_select_own on public.learner_workshop_outputs;
create policy learner_workshop_outputs_select_own
  on public.learner_workshop_outputs
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists learner_workshop_outputs_select_staff on public.learner_workshop_outputs;
create policy learner_workshop_outputs_select_staff
  on public.learner_workshop_outputs
  for select
  to authenticated
  using (public.can_read_course_workshop_outputs(course_id));

drop policy if exists learner_workshop_outputs_insert_own on public.learner_workshop_outputs;
create policy learner_workshop_outputs_insert_own
  on public.learner_workshop_outputs
  for insert
  to authenticated
  with check (user_id = auth.uid() and is_final = false);

drop policy if exists learner_workshop_outputs_update_own_draft on public.learner_workshop_outputs;
create policy learner_workshop_outputs_update_own_draft
  on public.learner_workshop_outputs
  for update
  to authenticated
  using (user_id = auth.uid() and is_final = false)
  with check (user_id = auth.uid());

grant select, insert, update on public.learner_workshop_outputs to authenticated;

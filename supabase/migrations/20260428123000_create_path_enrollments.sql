-- Create path enrollments pivot table (learner <-> path)
-- Required for galaxy-scoped parcours access.

begin;

create table if not exists public.path_enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid not null references public.paths(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, path_id)
);

create index if not exists path_enrollments_path_id_idx on public.path_enrollments (path_id);
create index if not exists path_enrollments_user_id_idx on public.path_enrollments (user_id);

alter table public.path_enrollments enable row level security;

-- Learners can read their own enrollments
drop policy if exists path_enrollments_self_select on public.path_enrollments;
create policy path_enrollments_self_select
  on public.path_enrollments
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Staff can manage enrollments for paths belonging to their organizations
-- (requires paths.org_id and org_memberships role in staff list)
drop policy if exists path_enrollments_staff_all on public.path_enrollments;
create policy path_enrollments_staff_all
  on public.path_enrollments
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.paths p
      join public.org_memberships m on m.org_id = p.org_id
      where p.id = path_enrollments.path_id
        and m.user_id = auth.uid()
        and lower(m.role) in ('admin','instructor','formateur')
    )
  )
  with check (
    exists (
      select 1
      from public.paths p
      join public.org_memberships m on m.org_id = p.org_id
      where p.id = path_enrollments.path_id
        and m.user_id = auth.uid()
        and lower(m.role) in ('admin','instructor','formateur')
    )
  );

commit;


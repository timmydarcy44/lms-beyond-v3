create table if not exists public.enterprise_job_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  hard_skills text[] not null default '{}',
  soft_skills text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enterprise_job_roles_organization_id_idx
  on public.enterprise_job_roles (organization_id);

create index if not exists enterprise_job_roles_created_at_idx
  on public.enterprise_job_roles (created_at desc);

alter table public.enterprise_job_roles enable row level security;

drop policy if exists "enterprise_job_roles_same_org_select" on public.enterprise_job_roles;
create policy "enterprise_job_roles_same_org_select"
  on public.enterprise_job_roles
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.company_id is not null
        and p.company_id = enterprise_job_roles.organization_id
    )
  );

drop policy if exists "enterprise_job_roles_same_org_insert" on public.enterprise_job_roles;
create policy "enterprise_job_roles_same_org_insert"
  on public.enterprise_job_roles
  for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.company_id is not null
        and p.company_id = enterprise_job_roles.organization_id
    )
  );

drop policy if exists "enterprise_job_roles_same_org_update" on public.enterprise_job_roles;
create policy "enterprise_job_roles_same_org_update"
  on public.enterprise_job_roles
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.company_id is not null
        and p.company_id = enterprise_job_roles.organization_id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.company_id is not null
        and p.company_id = enterprise_job_roles.organization_id
    )
  );

drop policy if exists "enterprise_job_roles_same_org_delete" on public.enterprise_job_roles;
create policy "enterprise_job_roles_same_org_delete"
  on public.enterprise_job_roles
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.company_id is not null
        and p.company_id = enterprise_job_roles.organization_id
    )
  );

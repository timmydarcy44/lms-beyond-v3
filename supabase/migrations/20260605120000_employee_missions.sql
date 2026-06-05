-- Missions assignées par l'entreprise à un collaborateur (visible côté apprenant rattaché)

create table if not exists public.employee_missions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  employee_id uuid not null references public.employees (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  title text not null,
  description text,
  due_date date,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_missions_employee_idx
  on public.employee_missions (employee_id, status);

create index if not exists employee_missions_profile_idx
  on public.employee_missions (profile_id, status);

create index if not exists employee_missions_org_idx
  on public.employee_missions (organization_id);

alter table public.employee_missions enable row level security;

drop policy if exists employee_missions_learner_read on public.employee_missions;
create policy employee_missions_learner_read on public.employee_missions
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists employee_missions_learner_update on public.employee_missions;
create policy employee_missions_learner_update on public.employee_missions
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

grant select, update on public.employee_missions to authenticated;
grant all on public.employee_missions to service_role;

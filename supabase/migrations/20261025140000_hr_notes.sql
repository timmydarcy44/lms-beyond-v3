create table if not exists public.hr_notes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_notes_employee_idx
  on public.hr_notes (employee_id, created_at desc);

alter table public.hr_notes enable row level security;

drop policy if exists hr_notes_rh_admin on public.hr_notes;
create policy hr_notes_rh_admin on public.hr_notes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.employees e
      join public.profiles p on p.id = auth.uid()
      where e.id = hr_notes.employee_id
        and e.company_id is not null
        and e.company_id = p.company_id
        and lower(coalesce(p.role, '')) <> 'manager'
        and lower(coalesce(p.role_type, '')) <> 'manager'
        and (
          lower(coalesce(p.role, '')) in ('admin_hr', 'rh', 'admin', 'entreprise')
          or lower(coalesce(p.role_type, '')) in ('admin_hr', 'rh', 'admin', 'entreprise', 'super_admin')
        )
    )
  )
  with check (
    exists (
      select 1
      from public.employees e
      join public.profiles p on p.id = auth.uid()
      where e.id = hr_notes.employee_id
        and e.company_id is not null
        and e.company_id = p.company_id
        and lower(coalesce(p.role, '')) <> 'manager'
        and lower(coalesce(p.role_type, '')) <> 'manager'
        and (
          lower(coalesce(p.role, '')) in ('admin_hr', 'rh', 'admin', 'entreprise')
          or lower(coalesce(p.role_type, '')) in ('admin_hr', 'rh', 'admin', 'entreprise', 'super_admin')
        )
    )
  );

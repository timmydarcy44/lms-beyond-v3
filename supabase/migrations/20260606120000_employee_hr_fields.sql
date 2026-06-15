-- Fiche RH collaborateur : date d'entrée, téléphone, documents RH

alter table public.employees
  add column if not exists hire_date date,
  add column if not exists phone text;

create table if not exists public.employee_hr_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  organization_id uuid not null,
  document_type text not null check (
    document_type in ('entretien_individuel', 'bilan_annuel', 'autre')
  ),
  title text not null,
  document_date date,
  notes text,
  file_url text,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_hr_documents_employee_idx
  on public.employee_hr_documents (employee_id, document_date desc);

alter table public.employee_hr_documents enable row level security;

drop policy if exists employee_hr_documents_service on public.employee_hr_documents;
create policy employee_hr_documents_service on public.employee_hr_documents
  for all
  using (true)
  with check (true);

grant select, insert, update, delete on public.employee_hr_documents to authenticated;
grant all on public.employee_hr_documents to service_role;

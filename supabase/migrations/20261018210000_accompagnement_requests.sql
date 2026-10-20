create table if not exists public.accompagnement_requests (
  id uuid primary key,
  organization_id uuid,
  employee_user_id uuid,
  employee_name text,
  practitioner_name text not null,
  practitioner_title text,
  payer text not null,
  status text not null default 'pending_employer',
  created_at timestamptz not null default now()
);

alter table public.accompagnement_requests enable row level security;

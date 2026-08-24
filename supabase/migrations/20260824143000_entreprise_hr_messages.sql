-- Messagerie interne RH ↔ collaborateur (style iMessage, sans email)

create table if not exists public.entreprise_hr_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text not null,
  employee_name text,
  employee_job_title text,
  sender_role text not null check (sender_role in ('rh', 'employee')),
  sender_user_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists entreprise_hr_messages_org_employee_idx
  on public.entreprise_hr_messages (org_id, employee_id, created_at asc);

create index if not exists entreprise_hr_messages_org_created_idx
  on public.entreprise_hr_messages (org_id, created_at desc);

alter table public.entreprise_hr_messages enable row level security;

-- Accès via service role côté API dashboard entreprise
drop policy if exists entreprise_hr_messages_deny_all on public.entreprise_hr_messages;
create policy entreprise_hr_messages_deny_all
  on public.entreprise_hr_messages
  for all
  using (false)
  with check (false);

comment on table public.entreprise_hr_messages is
  'Fil de discussion rapide RH ↔ collaborateur (messagerie interne entreprise).';

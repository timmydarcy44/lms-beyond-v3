create table if not exists public.cfa_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  siret text,
  contact_name text,
  email text,
  phone text,
  apprentices_wanted integer,
  apprentice_track_1 text,
  apprentice_track_2 text,
  status text not null default 'to_contact',
  notes text,
  interview_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cfa_companies_status_check check (
    status in (
      'to_contact',
      'email_sent',
      'appointment',
      'pending_decision',
      'recruiting',
      'recruited',
      'not_recruited'
    )
  ),
  constraint cfa_companies_apprentices_check check (
    apprentices_wanted is null or apprentices_wanted between 1 and 2
  )
);

alter table public.cfa_companies enable row level security;

create table if not exists public.cfa_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  siret text,
  contact_name text,
  contact_first_name text,
  contact_last_name text,
  contact_role text,
  email text,
  phone text,
  company_address text,
  soft_skills text,
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
    apprentices_wanted is null or apprentices_wanted between 1 and 30
  )
);

alter table public.cfa_companies enable row level security;

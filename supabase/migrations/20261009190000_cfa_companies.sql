create table if not exists public.cfa_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  status text not null default 'profile',
  notes text,
  interview_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cfa_companies_status_check check (
    status in (
      'profile',
      'challenge',
      'dossier',
      'interview',
      'review',
      'administrative',
      'admitted',
      'rejected'
    )
  )
);

alter table public.cfa_companies enable row level security;

-- CRM Byound Care (un espace par expert Care).
-- À coller dans le SQL Editor Supabase du projet LMS.

create table if not exists public.expert_care_clients (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  phone text,
  address_line text,
  postal_code text,
  city text,
  follow_up text not null default 'self',
  child_one_first_name text,
  child_one_last_name text,
  child_two_first_name text,
  child_two_last_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expert_care_clients_expert_idx on public.expert_care_clients (expert_id);
create index if not exists expert_care_clients_email_idx on public.expert_care_clients (expert_id, lower(email));

create table if not exists public.expert_care_invites (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  client_id uuid not null references public.expert_care_clients(id) on delete cascade,
  test_slug text not null,
  token text not null unique,
  sent_at timestamptz,
  opened_at timestamptz,
  completed_at timestamptz,
  response_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists expert_care_invites_token_idx on public.expert_care_invites (token);
create index if not exists expert_care_invites_client_idx on public.expert_care_invites (client_id);

create table if not exists public.expert_care_responses (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  client_id uuid not null references public.expert_care_clients(id) on delete cascade,
  invite_id uuid references public.expert_care_invites(id) on delete set null,
  test_slug text not null,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  score_label text,
  synthesis text,
  submitted_at timestamptz not null default now()
);

create index if not exists expert_care_responses_client_idx on public.expert_care_responses (client_id, submitted_at desc);

create table if not exists public.expert_care_invoices (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  client_id uuid not null references public.expert_care_clients(id) on delete cascade,
  amount_cents integer not null default 0,
  designation text not null default 'Prestation Byound Care',
  document_url text,
  document_name text,
  status text not null default 'sent',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists expert_care_invoices_expert_idx on public.expert_care_invoices (expert_id, created_at desc);

alter table public.expert_care_clients enable row level security;
alter table public.expert_care_invites enable row level security;
alter table public.expert_care_responses enable row level security;
alter table public.expert_care_invoices enable row level security;

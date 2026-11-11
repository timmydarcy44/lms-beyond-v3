-- Byound Ready — fiche OPCO sécurisée et éphémère (lien + OTP + saisies chiffrées)

alter table public.of_settings
  add column if not exists iban text,
  add column if not exists bic text,
  add column if not exists bank_account_holder text;

alter table public.organizations
  add column if not exists idcc text,
  add column if not exists headcount integer,
  add column if not exists opco_member_number text;

create table if not exists public.ready_links (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  document_id uuid not null references public.formation_documents (id) on delete cascade,
  token_hash text not null,
  recipient_email text not null,
  recipient_name text,
  status text not null default 'active'
    check (status in ('active', 'blocked', 'submitted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  blocked_until timestamptz,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_attempts integer not null default 0,
  otp_sent_count_window integer not null default 0,
  otp_window_started_at timestamptz,
  submitted_at timestamptz,
  opened_at timestamptz,
  progress_ready integer not null default 0,
  progress_total integer not null default 0,
  payment_mode text check (payment_mode is null or payment_mode in ('subrogation', 'remboursement')),
  company_fields_enc bytea,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  purged_at timestamptz,
  constraint ready_links_token_hash_uidx unique (token_hash)
);

create unique index if not exists ready_links_one_active_per_document
  on public.ready_links (document_id)
  where status = 'active';

create index if not exists ready_links_dossier_idx
  on public.ready_links (dossier_id);

create index if not exists ready_links_expires_idx
  on public.ready_links (expires_at)
  where status in ('active', 'blocked', 'submitted');

create table if not exists public.ready_learners (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.ready_links (id) on delete cascade,
  participant_id uuid references public.formation_participants (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  fields_enc bytea,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ready_learners_link_idx
  on public.ready_learners (link_id, sort_order);

create table if not exists public.ready_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.ready_links (id) on delete cascade,
  event_type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ready_events_link_idx
  on public.ready_events (link_id, created_at desc);

alter table public.ready_links enable row level security;
alter table public.ready_learners enable row level security;
alter table public.ready_events enable row level security;

-- Aucune policy client : accès uniquement via service role (route handlers).
drop policy if exists ready_links_staff on public.ready_links;
create policy ready_links_staff on public.ready_links
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists ready_learners_staff on public.ready_learners;
create policy ready_learners_staff on public.ready_learners
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists ready_events_staff on public.ready_events;
create policy ready_events_staff on public.ready_events
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

comment on table public.ready_links is 'Byound Ready — liens OPCO éphémères (jeton hashé, OTP hashé, saisies chiffrées).';
comment on column public.ready_links.token_hash is 'SHA-256 du jeton URL — jamais le jeton en clair.';
comment on column public.ready_links.company_fields_enc is 'AES-256-GCM des champs entreprise saisis par le RH.';
comment on column public.ready_learners.fields_enc is 'AES-256-GCM des champs sensibles stagiaire (DOB, contrat, CSP, etc.).';

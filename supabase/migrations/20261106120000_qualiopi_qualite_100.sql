-- Qualiopi 100% : process docs, réclamations, PAQ, compétences formateurs

alter table public.crm_qualiopi_veille_sources
  drop constraint if exists crm_qualiopi_veille_sources_kind_check;
alter table public.crm_qualiopi_veille_sources
  add constraint crm_qualiopi_veille_sources_kind_check
  check (kind in ('globale', 'legale', 'metier', 'pedagogie'));

alter table public.crm_qualiopi_veille_digests
  drop constraint if exists crm_qualiopi_veille_digests_kind_check;
alter table public.crm_qualiopi_veille_digests
  add constraint crm_qualiopi_veille_digests_kind_check
  check (kind in ('globale', 'legale', 'metier', 'pedagogie'));

alter table public.crm_qualiopi_veille_highlights
  drop constraint if exists crm_qualiopi_veille_highlights_kind_check;
alter table public.crm_qualiopi_veille_highlights
  add constraint crm_qualiopi_veille_highlights_kind_check
  check (kind in ('globale', 'legale', 'metier', 'pedagogie'));

alter table public.crm_qualiopi_veille_highlights
  add column if not exists theme text
  check (theme is null or theme in ('reglementaire', 'metier', 'pedagogie', 'transversal'));

create table if not exists public.crm_qualiopi_process_docs (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique check (kind in ('reclamations', 'paq', 'formateurs', 'handicap', 'moyens')),
  title text not null,
  body text not null default '',
  file_url text,
  file_name text,
  status text not null default 'draft' check (status in ('draft', 'ready', 'attested')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_qualiopi_reclamations (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  requester_name text,
  requester_email text,
  requester_user_id uuid references auth.users (id) on delete set null,
  audience text check (audience is null or audience in ('entreprise', 'expert', 'apprenant', 'salarie', 'autre')),
  channel text not null default 'autre' check (channel in ('email', 'satisfaction', 'formulaire', 'dashboard', 'autre')),
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  received_at timestamptz not null default now(),
  ack_at timestamptz,
  closed_at timestamptz,
  response text,
  session_id uuid references public.crm_qualiopi_sessions (id) on delete set null,
  action_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_qualiopi_actions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cause text,
  owner_name text,
  due_at date,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  source text not null default 'manual' check (source in ('manual', 'reclamation', 'veille', 'satisfaction', 'revue')),
  reclamation_id uuid references public.crm_qualiopi_reclamations (id) on delete set null,
  highlight_id uuid references public.crm_qualiopi_veille_highlights (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_qualiopi_reclamations
  drop constraint if exists crm_qualiopi_reclamations_action_id_fkey;
alter table public.crm_qualiopi_reclamations
  add constraint crm_qualiopi_reclamations_action_id_fkey
  foreign key (action_id) references public.crm_qualiopi_actions (id) on delete set null;

-- Colonnes dashboard (idempotent si table déjà créée sans)
alter table public.crm_qualiopi_reclamations
  add column if not exists requester_user_id uuid references auth.users (id) on delete set null;
alter table public.crm_qualiopi_reclamations
  add column if not exists audience text;
alter table public.crm_qualiopi_reclamations
  drop constraint if exists crm_qualiopi_reclamations_channel_check;
alter table public.crm_qualiopi_reclamations
  add constraint crm_qualiopi_reclamations_channel_check
  check (channel in ('email', 'satisfaction', 'formulaire', 'dashboard', 'autre'));

create table if not exists public.crm_qualiopi_formateur_plans (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  skills jsonb not null default '{}'::jsonb,
  needs text,
  year int not null default extract(year from now())::int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expert_id, year)
);

create table if not exists public.crm_qualiopi_formateur_actions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.crm_qualiopi_formateur_plans (id) on delete cascade,
  title text not null,
  action_date date,
  proof_url text,
  status text not null default 'todo' check (status in ('todo', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_reclamations_status_idx
  on public.crm_qualiopi_reclamations (status, received_at desc);
create index if not exists crm_qualiopi_actions_status_idx
  on public.crm_qualiopi_actions (status, due_at);
create index if not exists crm_qualiopi_formateur_actions_plan_idx
  on public.crm_qualiopi_formateur_actions (plan_id);

alter table public.crm_qualiopi_process_docs enable row level security;
alter table public.crm_qualiopi_reclamations enable row level security;
alter table public.crm_qualiopi_actions enable row level security;
alter table public.crm_qualiopi_formateur_plans enable row level security;
alter table public.crm_qualiopi_formateur_actions enable row level security;

drop policy if exists crm_qualiopi_process_docs_super on public.crm_qualiopi_process_docs;
create policy crm_qualiopi_process_docs_super on public.crm_qualiopi_process_docs
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_reclamations_super on public.crm_qualiopi_reclamations;
create policy crm_qualiopi_reclamations_super on public.crm_qualiopi_reclamations
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_reclamations_insert_own on public.crm_qualiopi_reclamations;
create policy crm_qualiopi_reclamations_insert_own on public.crm_qualiopi_reclamations
  for insert with check (auth.uid() is not null and requester_user_id = auth.uid());

drop policy if exists crm_qualiopi_actions_super on public.crm_qualiopi_actions;
create policy crm_qualiopi_actions_super on public.crm_qualiopi_actions
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_formateur_plans_super on public.crm_qualiopi_formateur_plans;
create policy crm_qualiopi_formateur_plans_super on public.crm_qualiopi_formateur_plans
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_formateur_actions_super on public.crm_qualiopi_formateur_actions;
create policy crm_qualiopi_formateur_actions_super on public.crm_qualiopi_formateur_actions
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

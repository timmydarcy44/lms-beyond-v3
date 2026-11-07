-- Lot 1 — Dossier formation + Session + of_settings + migration coquilles Qualiopi

-- ---------------------------------------------------------------------------
-- Backup + archive des coquilles "Formation à programmer"
-- ---------------------------------------------------------------------------
-- LIKE sans INDEXES : évite les collisions de noms d'index avec les tables live
create table if not exists public.crm_qualiopi_sessions_backup_20261107 (
  like public.crm_qualiopi_sessions including defaults including constraints including comments
);

create table if not exists public.crm_qualiopi_attendees_backup_20261107 (
  like public.crm_qualiopi_attendees including defaults including constraints including comments
);

create table if not exists public.crm_qualiopi_documents_backup_20261107 (
  like public.crm_qualiopi_documents including defaults including constraints including comments
);

insert into public.crm_qualiopi_sessions_backup_20261107
select * from public.crm_qualiopi_sessions s
where not exists (
  select 1 from public.crm_qualiopi_sessions_backup_20261107 b where b.id = s.id
);

insert into public.crm_qualiopi_attendees_backup_20261107
select a.* from public.crm_qualiopi_attendees a
where exists (
  select 1 from public.crm_qualiopi_sessions_backup_20261107 b where b.id = a.session_id
)
and not exists (
  select 1 from public.crm_qualiopi_attendees_backup_20261107 x where x.id = a.id
);

insert into public.crm_qualiopi_documents_backup_20261107
select d.* from public.crm_qualiopi_documents d
where d.session_id is not null
  and exists (
    select 1 from public.crm_qualiopi_sessions_backup_20261107 b where b.id = d.session_id
  )
and not exists (
  select 1 from public.crm_qualiopi_documents_backup_20261107 x where x.id = d.id
);

alter table public.crm_qualiopi_sessions
  add column if not exists archived_at timestamptz;

-- Coquille = titre placeholder + pas de programmation (date / envois / participants)
with shells as (
  select s.id
  from public.crm_qualiopi_sessions s
  where s.archived_at is null
    and coalesce(nullif(trim(s.course_name), ''), 'Formation à programmer') = 'Formation à programmer'
    and s.scheduled_at is null
    and s.convention_sent_at is null
    and s.reglement_sent_at is null
    and s.livret_sent_at is null
    and s.emargement_sent_at is null
    and not exists (
      select 1 from public.crm_qualiopi_attendees a where a.session_id = s.id
    )
)
update public.crm_qualiopi_sessions s
set archived_at = now(),
    updated_at = now()
from shells
where s.id = shells.id;

-- ---------------------------------------------------------------------------
-- Paramètres OF
-- ---------------------------------------------------------------------------
create table if not exists public.of_settings (
  id uuid primary key default gen_random_uuid(),
  legal_name text,
  nda text,
  siret text,
  siren text,
  vat_intra text,
  address_line text,
  address_city text,
  address_zip text,
  address_country text default 'FR',
  fiscal_year_start date,
  fiscal_year_end date,
  referent_handicap_user_id uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.of_settings (id)
select '00000000-0000-4000-8000-000000000001'::uuid
where not exists (select 1 from public.of_settings);

alter table public.of_settings enable row level security;

drop policy if exists of_settings_staff on public.of_settings;
create policy of_settings_staff on public.of_settings
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- Enrichissements existants
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists siren text;

alter table public.training_courses
  add column if not exists bpf_objective text
    check (bpf_objective is null or bpf_objective in ('rncp', 'rs', 'cqp', 'autre')),
  add column if not exists rncp_rs_code text,
  add column if not exists nsf_code text,
  add column if not exists nsf_label text,
  add column if not exists lms_course_id uuid;

alter table public.profiles
  add column if not exists reference_email text,
  add column if not exists bpf_learner_status text
    check (
      bpf_learner_status is null
      or bpf_learner_status in (
        'salarie_prive',
        'apprenti',
        'demandeur_emploi',
        'particulier',
        'autre'
      )
    ),
  add column if not exists attendance_method_pref text
    check (
      attendance_method_pref is null
      or attendance_method_pref in ('passkey', 'otp', 'appareil_formateur')
    ),
  add column if not exists attendance_validation_pref text
    check (
      attendance_validation_pref is null
      or attendance_validation_pref in ('signature', 'confirmation', 'assistee')
    ),
  add column if not exists needs_specific_support boolean not null default false;

create unique index if not exists profiles_reference_email_uidx
  on public.profiles (lower(reference_email))
  where reference_email is not null;

-- ---------------------------------------------------------------------------
-- Sessions partagées
-- ---------------------------------------------------------------------------
create table if not exists public.formation_sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  modality_presence text check (modality_presence is null or modality_presence in ('presentiel', 'distanciel', 'hybride')),
  location_label text,
  visio_url text,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'in_progress', 'done', 'cancelled')),
  primary_trainer_expert_id uuid,
  trainer_kind text check (trainer_kind is null or trainer_kind in ('interne', 'externe')),
  virtual_class_logs_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formation_slots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.formation_sessions (id) on delete cascade,
  slot_date date not null,
  day_part text not null check (day_part in ('matin', 'apres_midi')),
  starts_at timestamptz,
  ends_at timestamptz,
  face_to_face_minutes integer,
  attendance_opens_at timestamptz,
  attendance_closes_at timestamptz,
  attendance_close_offset_minutes integer not null default 30,
  created_at timestamptz not null default now(),
  unique (session_id, slot_date, day_part)
);

create index if not exists formation_slots_session_idx on public.formation_slots (session_id);

-- ---------------------------------------------------------------------------
-- Dossiers formation
-- ---------------------------------------------------------------------------
create table if not exists public.formation_dossiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  deal_id uuid references public.crm_pipeline_deals (id) on delete set null,
  session_id uuid references public.formation_sessions (id) on delete set null,
  training_course_id uuid references public.training_courses (id) on delete set null,
  course_title text,
  modality_intra_inter text check (modality_intra_inter is null or modality_intra_inter in ('intra', 'inter')),
  modality_presence text check (modality_presence is null or modality_presence in ('presentiel', 'distanciel', 'hybride')),
  funding_type text check (funding_type is null or funding_type in ('direct', 'opco', 'subrogation')),
  bpf_funder_type text check (
    bpf_funder_type is null
    or bpf_funder_type in (
      'entreprises_salaries',
      'opco',
      'pouvoirs_publics',
      'cpf',
      'particuliers',
      'autres_of',
      'autres_produits'
    )
  ),
  amount_ht_cents integer,
  amount_tva_cents integer,
  amount_ttc_cents integer,
  owner_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'qualification'
    check (
      status in (
        'qualification',
        'devis',
        'convention',
        'mise_en_place',
        'session',
        'fin',
        'cloture'
      )
    ),
  source text not null default 'manual'
    check (source in ('deal_won', 'manual', 'site_request', 'dashboard_request')),
  subcontracting text not null default 'aucune'
    check (subcontracting in ('aucune', 'recue', 'confiee')),
  partner_of_name text,
  partner_of_siret text,
  partner_of_amount_ht_cents integer,
  pending_confirm_fields jsonb not null default '[]'::jsonb,
  deal_regressed boolean not null default false,
  deal_regressed_at timestamptz,
  identity_check_first_attendance boolean not null default false,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists formation_dossiers_deal_won_uidx
  on public.formation_dossiers (deal_id)
  where source = 'deal_won' and deal_id is not null;

create index if not exists formation_dossiers_org_idx on public.formation_dossiers (organization_id);
create index if not exists formation_dossiers_status_idx on public.formation_dossiers (status);
create index if not exists formation_dossiers_session_idx on public.formation_dossiers (session_id);
create index if not exists formation_dossiers_deal_idx on public.formation_dossiers (deal_id);

create table if not exists public.formation_participants (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  job_title text,
  bpf_learner_status text
    check (
      bpf_learner_status is null
      or bpf_learner_status in (
        'salarie_prive',
        'apprenti',
        'demandeur_emploi',
        'particulier',
        'autre'
      )
    ),
  needs_specific_support boolean not null default false,
  created_at timestamptz not null default now(),
  unique (dossier_id, profile_id)
);

create index if not exists formation_participants_profile_idx
  on public.formation_participants (profile_id);

create table if not exists public.formation_documents (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  kind text not null,
  title text not null,
  status text not null default 'to_generate'
    check (status in ('to_generate', 'sent', 'opened', 'signed')),
  file_url text,
  sent_at timestamptz,
  opened_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dossier_id, kind)
);

create table if not exists public.formation_assignments (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  action_key text not null
    check (action_key in ('devis', 'formateur', 'facture', 'cloture_emargement')),
  assignee_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dossier_id, action_key)
);

create table if not exists public.formation_events (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_user_id uuid references auth.users (id) on delete set null,
  motif text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists formation_events_dossier_idx
  on public.formation_events (dossier_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.formation_sessions enable row level security;
alter table public.formation_slots enable row level security;
alter table public.formation_dossiers enable row level security;
alter table public.formation_participants enable row level security;
alter table public.formation_documents enable row level security;
alter table public.formation_assignments enable row level security;
alter table public.formation_events enable row level security;

drop policy if exists formation_sessions_staff on public.formation_sessions;
create policy formation_sessions_staff on public.formation_sessions
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_slots_staff on public.formation_slots;
create policy formation_slots_staff on public.formation_slots
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_dossiers_staff on public.formation_dossiers;
create policy formation_dossiers_staff on public.formation_dossiers
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_participants_staff on public.formation_participants;
create policy formation_participants_staff on public.formation_participants
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_documents_staff on public.formation_documents;
create policy formation_documents_staff on public.formation_documents
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_assignments_staff on public.formation_assignments;
create policy formation_assignments_staff on public.formation_assignments
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_events_staff on public.formation_events;
create policy formation_events_staff on public.formation_events
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

comment on table public.formation_dossiers is 'Dossier formation (ops) — distinct du deal commercial';
comment on table public.crm_qualiopi_sessions_backup_20261107 is 'Backup pré-archivage coquilles Qualiopi Lot 1';

-- Qualiopi Lot 3 (RNQ V10) — engagement / abandons / signalements (ind. 12)
-- Additive only. Pas de modification CFA.

-- ---------------------------------------------------------------------------
-- of_settings knobs
-- ---------------------------------------------------------------------------
alter table public.of_settings
  add column if not exists referent_qualite_user_id uuid references auth.users (id) on delete set null,
  add column if not exists referent_signalement_user_id uuid references auth.users (id) on delete set null,
  add column if not exists lms_inactive_alert_days integer not null default 7
    check (lms_inactive_alert_days >= 1 and lms_inactive_alert_days <= 90),
  add column if not exists reclamation_ack_business_days integer not null default 5
    check (reclamation_ack_business_days >= 1 and reclamation_ack_business_days <= 30),
  add column if not exists reclamation_reply_business_days integer not null default 15
    check (reclamation_reply_business_days >= 1 and reclamation_reply_business_days <= 60),
  add column if not exists signalement_ack_business_days integer not null default 2
    check (signalement_ack_business_days >= 1 and signalement_ack_business_days <= 15);

comment on column public.of_settings.referent_signalement_user_id is
  'Qualiopi ind.12 — référent signalements sensibles (VHD). Accès RLS restreint.';
comment on column public.of_settings.lms_inactive_alert_days is
  'Qualiopi ind.12 — seuil d''inactivité LMS (jours) pour alerte engagement.';

-- ---------------------------------------------------------------------------
-- Abandons / sorties apprenant
-- ---------------------------------------------------------------------------
create table if not exists public.formation_participant_exits (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  participant_id uuid not null references public.formation_participants (id) on delete cascade,
  exited_at date not null default current_date,
  kind text not null default 'abandon'
    check (kind in ('abandon', 'annulation', 'report', 'autre')),
  motif_code text not null default 'autre'
    check (
      motif_code in (
        'personnel',
        'professionnel',
        'sante',
        'inadequation',
        'financier',
        'demenagement',
        'autre'
      )
    ),
  motif_detail text,
  detected_via text
    check (
      detected_via is null
      or detected_via in ('absence', 'inactivite_lms', 'demande', 'positionnement', 'autre')
    ),
  actions_taken text,
  closed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id)
);

create index if not exists formation_participant_exits_dossier_idx
  on public.formation_participant_exits (dossier_id, exited_at desc);

comment on table public.formation_participant_exits is
  'Qualiopi ind.12 / ind.2 — sorties et abandons apprenants (alimente le taux d''abandon).';

-- ---------------------------------------------------------------------------
-- Alertes engagement + actions de relance tracées
-- ---------------------------------------------------------------------------
create table if not exists public.formation_engagement_alerts (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  participant_id uuid references public.formation_participants (id) on delete cascade,
  kind text not null
    check (kind in ('lms_inactive', 'absence', 'positionnement_manquant')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'dismissed')),
  detected_at timestamptz not null default now(),
  detail text,
  meta jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists formation_engagement_alerts_open_uidx
  on public.formation_engagement_alerts (
    dossier_id,
    coalesce(participant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    kind
  )
  where status in ('open', 'in_progress');

create index if not exists formation_engagement_alerts_dossier_idx
  on public.formation_engagement_alerts (dossier_id, status, detected_at desc);

create table if not exists public.formation_engagement_actions (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.formation_engagement_alerts (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action_at timestamptz not null default now(),
  channel text not null default 'autre'
    check (channel in ('email', 'telephone', 'visio', 'presentiel', 'lms', 'autre')),
  result text not null default 'en_attente'
    check (
      result in (
        'en_attente',
        'contacte',
        'repondu',
        'sans_reponse',
        'abandon_constate',
        'resolu',
        'autre'
      )
    ),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists formation_engagement_actions_alert_idx
  on public.formation_engagement_actions (alert_id, action_at desc);

comment on table public.formation_engagement_alerts is
  'Qualiopi ind.12 — alertes engagement (inactivité LMS, absence, positionnement).';
comment on table public.formation_engagement_actions is
  'Qualiopi ind.12 — relances tracées (qui, quand, canal, résultat).';

-- ---------------------------------------------------------------------------
-- Signalements sensibles (séparé des réclamations qualité)
-- ---------------------------------------------------------------------------
create or replace function public.is_signalement_staff(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user_id is not null
    and (
      exists (
        select 1
        from public.super_admins sa
        where sa.user_id = p_user_id
          and sa.is_active is true
      )
      or exists (
        select 1
        from public.of_settings ofs
        where ofs.id = '00000000-0000-4000-8000-000000000001'::uuid
          and ofs.referent_signalement_user_id = p_user_id
      )
    );
$$;

revoke all on function public.is_signalement_staff(uuid) from public;
grant execute on function public.is_signalement_staff(uuid) to authenticated;
grant execute on function public.is_signalement_staff(uuid) to service_role;

create table if not exists public.crm_qualiopi_signalements (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('violence', 'harcelement', 'discrimination', 'autre_sensible')),
  subject text not null,
  description text not null default '',
  status text not null default 'received'
    check (status in ('received', 'acked', 'in_progress', 'closed')),
  is_anonymous boolean not null default false,
  requester_user_id uuid references auth.users (id) on delete set null,
  requester_name text,
  requester_email text,
  audience text
    check (
      audience is null
      or audience in ('entreprise', 'expert', 'apprenant', 'salarie', 'autre')
    ),
  dossier_id uuid references public.formation_dossiers (id) on delete set null,
  received_at timestamptz not null default now(),
  ack_at timestamptz,
  in_progress_at timestamptz,
  closed_at timestamptz,
  internal_notes text,
  response text,
  notified_referent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_signalements_status_idx
  on public.crm_qualiopi_signalements (status, received_at desc);

create table if not exists public.crm_qualiopi_signalement_events (
  id uuid primary key default gen_random_uuid(),
  signalement_id uuid not null references public.crm_qualiopi_signalements (id) on delete cascade,
  event_type text not null
    check (
      event_type in (
        'created',
        'acked',
        'in_progress',
        'closed',
        'note',
        'notified'
      )
    ),
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_signalement_events_idx
  on public.crm_qualiopi_signalement_events (signalement_id, created_at desc);

comment on table public.crm_qualiopi_signalements is
  'Qualiopi ind.12 — registre signalements VHD (accès restreint, séparé des réclamations).';

-- ---------------------------------------------------------------------------
-- Process docs : procédure signalements
-- ---------------------------------------------------------------------------
alter table public.crm_qualiopi_process_docs
  drop constraint if exists crm_qualiopi_process_docs_kind_check;
alter table public.crm_qualiopi_process_docs
  add constraint crm_qualiopi_process_docs_kind_check
  check (kind in ('reclamations', 'paq', 'formateurs', 'handicap', 'moyens', 'signalements'));

insert into public.crm_qualiopi_process_docs (kind, title, body, status)
values (
  'signalements',
  'Procédure signalements violences / harcèlement / discriminations',
  'À rédiger — procédure écrite de recueil et traitement des signalements sensibles (anonymat possible, délais, référent dédié).',
  'draft'
)
on conflict (kind) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.formation_participant_exits enable row level security;
alter table public.formation_engagement_alerts enable row level security;
alter table public.formation_engagement_actions enable row level security;
alter table public.crm_qualiopi_signalements enable row level security;
alter table public.crm_qualiopi_signalement_events enable row level security;

drop policy if exists formation_participant_exits_staff on public.formation_participant_exits;
create policy formation_participant_exits_staff on public.formation_participant_exits
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_engagement_alerts_staff on public.formation_engagement_alerts;
create policy formation_engagement_alerts_staff on public.formation_engagement_alerts
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_engagement_actions_staff on public.formation_engagement_actions;
create policy formation_engagement_actions_staff on public.formation_engagement_actions
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

-- Signalements : lecture/écriture staff signalement uniquement
drop policy if exists crm_qualiopi_signalements_staff on public.crm_qualiopi_signalements;
create policy crm_qualiopi_signalements_staff on public.crm_qualiopi_signalements
  for all using (public.is_signalement_staff(auth.uid()))
  with check (public.is_signalement_staff(auth.uid()));

-- Insert propre (déclarant) — sans lecture des notes internes
drop policy if exists crm_qualiopi_signalements_insert_own on public.crm_qualiopi_signalements;
create policy crm_qualiopi_signalements_insert_own on public.crm_qualiopi_signalements
  for insert
  with check (
    auth.uid() is not null
    and (requester_user_id is null or requester_user_id = auth.uid())
  );

drop policy if exists crm_qualiopi_signalement_events_staff on public.crm_qualiopi_signalement_events;
create policy crm_qualiopi_signalement_events_staff on public.crm_qualiopi_signalement_events
  for all using (public.is_signalement_staff(auth.uid()))
  with check (public.is_signalement_staff(auth.uid()));

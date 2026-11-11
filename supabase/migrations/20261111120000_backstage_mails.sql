-- Byound Backstage (ex Pack formateur) : kinds + journal d'envois
-- Script idempotent : peut être rejoué tel quel.

-- 1) Kinds planifiés : Backstage J-2 + rappel jour J (+ ancien pack_formateur_j1 conservé)
alter table public.formation_scheduled_mails
  drop constraint if exists formation_scheduled_mails_kind_check;

alter table public.formation_scheduled_mails
  add constraint formation_scheduled_mails_kind_check
  check (kind in (
    'devis_relance_j3',
    'devis_relance_j7',
    'convention_relance_j3',
    'convention_relance_j7',
    'convocation_j7',
    'positionnement_j3',
    'positionnement_synth_formateur',
    'pack_formateur_j1',
    'backstage_j2',
    'backstage_rappel',
    'absent_relance',
    'eval_froid_j60',
    'questionnaire_entreprise_j60'
  ));

comment on table public.formation_scheduled_mails is
  'File d''attente mails formation (relances, convocations, positionnement, Backstage, absents, J+60)';

-- 2) Journal d'envois Backstage (anti-doublon + resend_id)
create table if not exists public.formation_backstage_sends (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  session_id uuid references public.formation_sessions (id) on delete set null,
  slot_id uuid references public.formation_slots (id) on delete set null,
  formateur_id uuid references public.profiles (id) on delete set null,
  to_email text not null,
  mail_type text not null,
  resend_id text,
  status text not null default 'sent',
  error text,
  forced boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.formation_backstage_sends
  drop constraint if exists formation_backstage_sends_mail_type_check;
alter table public.formation_backstage_sends
  add constraint formation_backstage_sends_mail_type_check
  check (mail_type in ('backstage', 'rappel'));

alter table public.formation_backstage_sends
  drop constraint if exists formation_backstage_sends_status_check;
alter table public.formation_backstage_sends
  add constraint formation_backstage_sends_status_check
  check (status in ('sent', 'failed', 'skipped'));

create unique index if not exists formation_backstage_sends_uniq_sent
  on public.formation_backstage_sends (dossier_id, slot_id, mail_type)
  where status = 'sent' and forced = false;

create index if not exists formation_backstage_sends_dossier_idx
  on public.formation_backstage_sends (dossier_id, created_at desc);

comment on table public.formation_backstage_sends is
  'Trace des e-mails Byound Backstage / rappel (session, formateur, resend_id, statut).';

-- 3) RLS staff Byound (même helper que les autres tables formation)
alter table public.formation_backstage_sends enable row level security;

drop policy if exists formation_backstage_sends_staff on public.formation_backstage_sends;
create policy formation_backstage_sends_staff on public.formation_backstage_sends
  for all
  using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

-- Lot 4b — Relances planifiées (J+3 / J+7 / absents / J+60)

create table if not exists public.formation_scheduled_mails (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  participant_id uuid references public.formation_participants (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  slot_id uuid references public.formation_slots (id) on delete set null,
  document_id uuid references public.formation_documents (id) on delete set null,
  kind text not null
    check (kind in (
      'devis_relance_j3',
      'devis_relance_j7',
      'convention_relance_j3',
      'convention_relance_j7',
      'convocation_j7',
      'absent_relance',
      'eval_froid_j60',
      'questionnaire_entreprise_j60'
    )),
  to_email text not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists formation_scheduled_mails_due_idx
  on public.formation_scheduled_mails (scheduled_at)
  where sent_at is null and cancelled_at is null;

create unique index if not exists formation_scheduled_mails_dedupe_uidx
  on public.formation_scheduled_mails (
    dossier_id,
    kind,
    (coalesce(participant_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    (coalesce(slot_id, '00000000-0000-0000-0000-000000000000'::uuid))
  )
  where cancelled_at is null;

alter table public.formation_scheduled_mails enable row level security;

drop policy if exists formation_scheduled_mails_staff on public.formation_scheduled_mails;
create policy formation_scheduled_mails_staff on public.formation_scheduled_mails
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

comment on table public.formation_scheduled_mails is
  'File d''attente mails formation (relances devis/convention, convocations J-7, absents, J+60)';

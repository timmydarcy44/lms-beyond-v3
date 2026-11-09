-- Coffre Qualiopi : docs scopés par participant / créneau + méta preuves

alter table public.formation_documents
  add column if not exists participant_id uuid references public.formation_participants (id) on delete set null,
  add column if not exists slot_id uuid references public.formation_slots (id) on delete set null,
  add column if not exists meta jsonb not null default '{}'::jsonb;

comment on column public.formation_documents.participant_id is
  'Portée apprenant (certificat / attestation / convocation individuelle).';
comment on column public.formation_documents.slot_id is
  'Portée créneau (feuille d''émargement).';
comment on column public.formation_documents.meta is
  'Preuves annexes (OTP, snapshot CV, scores évals…).';

-- Remplace l’unicité stricte dossier+kind pour autoriser N feuilles / N certificats
alter table public.formation_documents
  drop constraint if exists formation_documents_dossier_id_kind_key;

drop index if exists formation_documents_dossier_id_kind_key;

create unique index if not exists formation_documents_dossier_kind_scope_uidx
  on public.formation_documents (
    dossier_id,
    kind,
    coalesce(participant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(slot_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists formation_documents_participant_idx
  on public.formation_documents (participant_id)
  where participant_id is not null;

create index if not exists formation_documents_slot_idx
  on public.formation_documents (slot_id)
  where slot_id is not null;

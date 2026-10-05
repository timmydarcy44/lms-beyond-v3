-- Rattrapage prod : colonne session_id + satisfaction (migration 20260818170000 non appliquée).

alter table public.crm_qualiopi_sessions
  add column if not exists satisfaction_sent_at timestamptz;

alter table public.crm_qualiopi_attendees
  add column if not exists satisfaction_token text,
  add column if not exists satisfaction_score int,
  add column if not exists satisfaction_comment text,
  add column if not exists satisfaction_at timestamptz;

update public.crm_qualiopi_attendees
set satisfaction_token = gen_random_uuid()::text
where satisfaction_token is null;

create unique index if not exists crm_qualiopi_attendees_satisfaction_token_idx
  on public.crm_qualiopi_attendees (satisfaction_token)
  where satisfaction_token is not null;

alter table public.crm_qualiopi_documents
  add column if not exists session_id uuid references public.crm_qualiopi_sessions (id) on delete cascade;

drop index if exists public.crm_qualiopi_documents_kind_unique;

create unique index if not exists crm_qualiopi_documents_template_kind_unique
  on public.crm_qualiopi_documents (kind)
  where session_id is null and kind in ('convention', 'reglement', 'livret');

create unique index if not exists crm_qualiopi_documents_session_kind_unique
  on public.crm_qualiopi_documents (session_id, kind)
  where session_id is not null and kind in ('convention', 'reglement', 'livret');

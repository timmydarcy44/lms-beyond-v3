alter table public.cfa_applications
  add column if not exists cerfa_data jsonb not null default '{}'::jsonb,
  add column if not exists administrative_documents jsonb not null default '{}'::jsonb,
  add column if not exists administrative_documents_submitted_at timestamptz,
  add column if not exists registration_fee_session_id text,
  add column if not exists registration_fee_paid_at timestamptz;

alter table public.cfa_applications
  drop constraint if exists cfa_applications_status_check;

alter table public.cfa_applications
  add constraint cfa_applications_status_check check (
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
  );

-- Invitations / liens de partage pour questionnaires Jessica
create table if not exists public.jessica_questionnaire_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  questionnaire_slug text not null,
  questionnaire_id uuid references public.jessica_questionnaires(id) on delete set null,
  recipient_email text not null,
  recipient_first_name text,
  recipient_last_name text,
  cabinet_patient_id uuid,
  profile_id uuid,
  sent_at timestamptz,
  opened_at timestamptz,
  completed_at timestamptz,
  response_id uuid references public.jessica_questionnaire_responses(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists jessica_questionnaire_invites_token_idx
  on public.jessica_questionnaire_invites (token);

create index if not exists jessica_questionnaire_invites_slug_idx
  on public.jessica_questionnaire_invites (questionnaire_slug);

create index if not exists jessica_questionnaire_invites_email_idx
  on public.jessica_questionnaire_invites (lower(recipient_email));

alter table public.jessica_questionnaire_invites enable row level security;

drop policy if exists jessica_questionnaire_invites_super_admin on public.jessica_questionnaire_invites;
create policy jessica_questionnaire_invites_super_admin
  on public.jessica_questionnaire_invites
  for all
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid()
    )
  );

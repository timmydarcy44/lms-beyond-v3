-- Journal des e-mails envoyés depuis un compte client (devis, convention, etc.)
-- Ouverture suivie via webhook Resend (email.opened → opened_at / status).

create table if not exists public.org_outbound_emails (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null,
  label text not null,
  subject text not null,
  to_email text not null,
  resend_id text,
  status text not null default 'envoyé'
    check (status in ('envoyé', 'délivré', 'ouvert', 'rejeté')),
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  actor_user_id uuid references public.profiles (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists org_outbound_emails_org_sent_idx
  on public.org_outbound_emails (org_id, sent_at desc);

create unique index if not exists org_outbound_emails_resend_to_uidx
  on public.org_outbound_emails (resend_id, to_email)
  where resend_id is not null;

alter table public.org_outbound_emails enable row level security;

drop policy if exists org_outbound_emails_super_all on public.org_outbound_emails;
create policy org_outbound_emails_super_all
  on public.org_outbound_emails
  for all
  to authenticated
  using (
    exists (
      select 1 from public.super_admins s
      where s.user_id = auth.uid() and s.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.super_admins s
      where s.user_id = auth.uid() and s.is_active = true
    )
  );

drop policy if exists org_outbound_emails_member_select on public.org_outbound_emails;
create policy org_outbound_emails_member_select
  on public.org_outbound_emails
  for select
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = org_outbound_emails.org_id
        and m.user_id = auth.uid()
    )
  );

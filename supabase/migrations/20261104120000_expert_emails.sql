-- Historique des e-mails envoyés à un expert depuis Byound Control.
-- Lecture et écriture réservées au staff (super admins). Le service role contourne la RLS.

create table if not exists public.expert_emails (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts (id) on delete cascade,
  sender_user_id uuid,
  sender_email text,
  subject text not null,
  html text not null,
  resend_id text,
  status text not null default 'envoyé',
  template_label text,
  created_at timestamptz not null default now()
);

create index if not exists expert_emails_expert_created_idx
  on public.expert_emails (expert_id, created_at desc);

alter table public.expert_emails enable row level security;

drop policy if exists expert_emails_super_all on public.expert_emails;
create policy expert_emails_super_all
  on public.expert_emails
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

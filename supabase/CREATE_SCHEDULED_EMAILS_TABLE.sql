create table if not exists public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  type text not null,
  send_at timestamptz not null,
  sent boolean not null default false,
  sent_at timestamptz,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_emails_send_at_idx on public.scheduled_emails (send_at);
create index if not exists scheduled_emails_sent_idx on public.scheduled_emails (sent);

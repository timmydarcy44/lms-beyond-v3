alter table public.scheduled_emails
add column if not exists metadata jsonb;

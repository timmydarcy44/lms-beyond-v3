-- Google Calendar Jessica + colonnes RDV pour CA cabinet

alter table public.appointments
  add column if not exists guest_email text,
  add column if not exists guest_name text,
  add column if not exists google_event_id text,
  add column if not exists cabinet_patient_id uuid references public.jessica_cabinet_patients(id) on delete set null;

create index if not exists appointments_guest_email_idx
  on public.appointments (lower(guest_email));

create index if not exists appointments_cabinet_patient_idx
  on public.appointments (cabinet_patient_id)
  where cabinet_patient_id is not null;

create table if not exists public.jessica_google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  calendar_id text not null default 'primary',
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jessica_google_calendar_connections_user_key unique (user_id)
);

alter table public.jessica_google_calendar_connections enable row level security;

drop policy if exists jessica_google_calendar_super_admin on public.jessica_google_calendar_connections;
create policy jessica_google_calendar_super_admin on public.jessica_google_calendar_connections
  for all to authenticated
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

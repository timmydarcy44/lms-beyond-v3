-- Lot 3a — Émargement anti-fraude (OTP, cookie device, clôture formateur)

create table if not exists public.attendance_slot_launches (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.formation_slots (id) on delete cascade,
  session_id uuid not null references public.formation_sessions (id) on delete cascade,
  mode text not null default 'code_oral' check (mode in ('qr', 'code_oral')),
  nonce text not null,
  revoked_at timestamptz,
  opened_at timestamptz not null default now(),
  closes_at timestamptz,
  opened_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists attendance_slot_launches_active_uidx
  on public.attendance_slot_launches (slot_id)
  where revoked_at is null;

create index if not exists attendance_slot_launches_session_idx
  on public.attendance_slot_launches (session_id);

create table if not exists public.attendance_devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  device_token_hash text not null unique,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists attendance_devices_profile_idx
  on public.attendance_devices (profile_id);

-- Passkeys (schéma prêt ; activation Lot 3b)
create table if not exists public.attendance_credentials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  sign_count integer not null default 0,
  synced boolean not null default false,
  created_at timestamptz not null default now(),
  created_during_slot_id uuid references public.formation_slots (id) on delete set null,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists attendance_credentials_profile_idx
  on public.attendance_credentials (profile_id);

create table if not exists public.attendance_otps (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.formation_slots (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists attendance_otps_slot_profile_idx
  on public.attendance_otps (slot_id, profile_id);

create table if not exists public.attendance_signatures (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.formation_slots (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  signature_svg text,
  signature_png_url text,
  server_timestamp timestamptz not null default now(),
  ip text,
  user_agent text,
  device_id uuid references public.attendance_devices (id) on delete set null,
  credential_id uuid references public.attendance_credentials (id) on delete set null,
  launch_id uuid references public.attendance_slot_launches (id) on delete set null,
  token_counter integer,
  delay_ms integer,
  source text not null check (source in ('qr', 'code_oral', 'appareil_formateur', 'ajout_manuel')),
  identification_method text not null check (identification_method in ('passkey', 'cookie', 'otp', 'formateur')),
  validation_mode text not null check (validation_mode in ('signature', 'confirmation', 'assistee')),
  arrived_at timestamptz,
  left_at timestamptz,
  first_activation boolean not null default false,
  person_seen boolean not null default false,
  identity_verified boolean not null default false,
  status text not null default 'ok' check (status in ('ok', 'a_verifier', 'invalidee')),
  status_motif text,
  alerts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (slot_id, profile_id)
);

create index if not exists attendance_signatures_slot_idx
  on public.attendance_signatures (slot_id);

create table if not exists public.attendance_closures (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.formation_slots (id) on delete cascade unique,
  trainer_user_id uuid not null references auth.users (id) on delete restrict,
  physical_count integer not null,
  valid_signature_count integer not null,
  trainer_signature_svg text,
  closed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  hits integer not null default 1,
  window_started_at timestamptz not null default now(),
  unique (bucket_key)
);

alter table public.attendance_slot_launches enable row level security;
alter table public.attendance_devices enable row level security;
alter table public.attendance_credentials enable row level security;
alter table public.attendance_otps enable row level security;
alter table public.attendance_signatures enable row level security;
alter table public.attendance_closures enable row level security;
alter table public.attendance_rate_limits enable row level security;

drop policy if exists attendance_launches_staff on public.attendance_slot_launches;
create policy attendance_launches_staff on public.attendance_slot_launches
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists attendance_devices_staff on public.attendance_devices;
create policy attendance_devices_staff on public.attendance_devices
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists attendance_credentials_staff on public.attendance_credentials;
create policy attendance_credentials_staff on public.attendance_credentials
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists attendance_otps_staff on public.attendance_otps;
create policy attendance_otps_staff on public.attendance_otps
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists attendance_signatures_staff on public.attendance_signatures;
create policy attendance_signatures_staff on public.attendance_signatures
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists attendance_closures_staff on public.attendance_closures;
create policy attendance_closures_staff on public.attendance_closures
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists attendance_rate_limits_staff on public.attendance_rate_limits;
create policy attendance_rate_limits_staff on public.attendance_rate_limits
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

comment on table public.attendance_signatures is 'Émargements Lot 3a — preuves présence (pas de biométrie stockée)';

-- Lot 3b — Passkeys WebAuthn (Face ID / empreinte / code téléphone)

alter table public.profiles
  add column if not exists attendance_passkey_prompt text
    check (
      attendance_passkey_prompt is null
      or attendance_passkey_prompt in ('pending', 'later', 'declined', 'enabled')
    ),
  add column if not exists attendance_prefer_otp boolean not null default false;

create table if not exists public.attendance_webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  slot_id uuid references public.formation_slots (id) on delete cascade,
  purpose text not null check (purpose in ('registration', 'authentication')),
  challenge text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists attendance_webauthn_challenges_profile_idx
  on public.attendance_webauthn_challenges (profile_id, purpose);

alter table public.attendance_credentials
  add column if not exists transports text[] default '{}',
  add column if not exists device_type text,
  add column if not exists backed_up boolean not null default false;

alter table public.attendance_webauthn_challenges enable row level security;

drop policy if exists attendance_webauthn_challenges_staff on public.attendance_webauthn_challenges;
create policy attendance_webauthn_challenges_staff on public.attendance_webauthn_challenges
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

comment on table public.attendance_credentials is 'Passkeys WebAuthn — credential_id + clé publique uniquement (aucune biométrie)';

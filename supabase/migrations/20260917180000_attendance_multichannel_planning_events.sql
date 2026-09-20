-- Émargement multicanal (QR + code + NFC + manuel) + types d'événements planning

-- Salles : point NFC (identifie la salle, pas la session)
alter table public.school_rooms
  add column if not exists nfc_tag_id text,
  add column if not exists nfc_label text;

create unique index if not exists school_rooms_nfc_tag_uidx
  on public.school_rooms (school_id, nfc_tag_id)
  where nfc_tag_id is not null and length(trim(nfc_tag_id)) > 0;

-- Codes temporaires de session (affichés / SMS)
create table if not exists public.school_attendance_session_codes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_attendance_sessions (id) on delete cascade,
  school_id uuid not null,
  phase text not null,
  code_hash text not null,
  code_hint text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint school_attendance_session_codes_phase_chk check (phase in ('checkin', 'checkout'))
);

create index if not exists school_attendance_session_codes_session_idx
  on public.school_attendance_session_codes (session_id);
create index if not exists school_attendance_session_codes_hash_idx
  on public.school_attendance_session_codes (code_hash);

-- Journal d'émargement (toutes méthodes)
create table if not exists public.school_attendance_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  session_id uuid not null references public.school_attendance_sessions (id) on delete cascade,
  record_id uuid references public.school_attendance_records (id) on delete set null,
  learner_id uuid references public.profiles (id) on delete set null,
  phase text not null,
  method text not null,
  success boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint school_attendance_events_phase_chk check (phase in ('checkin', 'checkout')),
  constraint school_attendance_events_method_chk check (
    method in ('qr', 'session_code', 'sms_code', 'nfc', 'manual')
  )
);

create index if not exists school_attendance_events_session_idx
  on public.school_attendance_events (session_id);
create index if not exists school_attendance_events_learner_idx
  on public.school_attendance_events (learner_id);

-- Types d'événements planning (cours / sortie / masterclass / elearning / examen)
alter table public.school_planning_slots
  add column if not exists event_type text not null default 'course',
  add column if not exists title text,
  add column if not exists location_text text,
  add column if not exists description text,
  add column if not exists online_course_id uuid,
  add column if not exists exam_kind text,
  add column if not exists thematic text,
  add column if not exists external_speaker text,
  add column if not exists due_at timestamptz;

do $$
begin
  alter table public.school_planning_slots
    add constraint school_planning_slots_event_type_chk
    check (event_type in ('course', 'outing', 'masterclass', 'elearning', 'exam'));
exception when duplicate_object then null;
end $$;

-- module_id optionnel pour non-cours
alter table public.school_planning_slots
  alter column module_id drop not null;

-- Lien formateur école ↔ expert EDGE
alter table public.school_instructors
  add column if not exists expert_id uuid,
  add column if not exists expert_invite_status text;

do $$
begin
  alter table public.school_instructors
    add constraint school_instructors_expert_invite_status_chk
    check (
      expert_invite_status is null
      or expert_invite_status in (
        'invited',
        'signup_started',
        'profile_completed',
        'active'
      )
    );
exception when duplicate_object then null;
end $$;

comment on table public.school_attendance_session_codes is
  'Codes numériques temporaires pour émargement (affichage formateur ou SMS).';
comment on table public.school_attendance_events is
  'Journal multicanal QR / code / SMS / NFC / manuel.';
comment on column public.school_rooms.nfc_tag_id is
  'Identifiant du tag NFC salle (pas la session).';
comment on column public.school_planning_slots.event_type is
  'course | outing | masterclass | elearning | exam';

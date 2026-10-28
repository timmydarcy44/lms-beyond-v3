-- Byound Care — throttle anti-spam + rappel J-1.

begin;

alter table public.care_bookings
  add column if not exists reminder_sent_at timestamptz;

create table if not exists public.care_booking_throttle (
  key text primary key,
  hits integer not null default 1,
  window_start timestamptz not null default now()
);

alter table public.care_booking_throttle enable row level security;

commit;

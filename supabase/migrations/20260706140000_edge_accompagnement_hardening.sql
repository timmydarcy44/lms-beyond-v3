-- Durcissement tunnel accompagnement EDGE : statuts, anti double-réservation, gestion RDV

alter table public.edge_accompagnement_reservations
  add column if not exists coach_name text not null default 'Expert EDGE',
  add column if not exists manage_token uuid not null default gen_random_uuid(),
  add column if not exists visio_url text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists checkout_expires_at timestamptz;

create unique index if not exists idx_edge_accompagnement_reservations_manage_token
  on public.edge_accompagnement_reservations (manage_token);

-- Un créneau ne peut être confirmé qu'une seule fois
create unique index if not exists idx_edge_accompagnement_reservations_slot_confirmed
  on public.edge_accompagnement_reservations (selected_slot)
  where payment_status = 'paid' and status = 'confirmed';

alter table public.edge_accompagnement_reservations drop constraint if exists edge_accompagnement_reservations_payment_status_check;
alter table public.edge_accompagnement_reservations
  add constraint edge_accompagnement_reservations_payment_status_check
  check (payment_status in ('pending', 'paid', 'cancelled', 'refunded', 'failed'));

alter table public.edge_accompagnement_reservations drop constraint if exists edge_accompagnement_reservations_status_check;
alter table public.edge_accompagnement_reservations
  add constraint edge_accompagnement_reservations_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'refunded'));

-- Holds temporaires pendant le checkout Stripe (avant paiement confirmé)
create table if not exists public.edge_accompagnement_slot_holds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  offer_slug text not null,
  selected_slot timestamptz not null,
  stripe_checkout_session_id text not null unique,
  user_email text not null,
  user_name text,
  user_phone text,
  amount_cents integer not null,
  duration_label text,
  offer_name text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_edge_accompagnement_slot_holds_slot_active
  on public.edge_accompagnement_slot_holds (selected_slot);

create index if not exists idx_edge_accompagnement_slot_holds_user
  on public.edge_accompagnement_slot_holds (user_id, created_at desc);

create index if not exists idx_edge_accompagnement_slot_holds_expires
  on public.edge_accompagnement_slot_holds (expires_at);

comment on table public.edge_accompagnement_slot_holds is
  'Blocage temporaire de créneau pendant checkout Stripe (expire après 30 min)';

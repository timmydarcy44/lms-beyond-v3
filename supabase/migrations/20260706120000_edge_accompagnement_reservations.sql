-- Réservations accompagnement EDGE (particulier) — paiement Stripe

create table if not exists public.edge_accompagnement_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  offer_slug text not null,
  offer_name text not null,
  amount_cents integer not null,
  duration_label text,
  selected_slot timestamptz not null,
  user_email text not null,
  user_name text,
  user_phone text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'confirmed', 'cancelled', 'refunded')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_edge_accompagnement_reservations_user
  on public.edge_accompagnement_reservations (user_id, created_at desc);

create index if not exists idx_edge_accompagnement_reservations_stripe_session
  on public.edge_accompagnement_reservations (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- Demandes programme (sans paiement immédiat)
create table if not exists public.edge_accompagnement_programme_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text not null,
  user_name text,
  objectif text not null,
  besoin text not null,
  disponibilite text not null,
  message text,
  status text not null default 'submitted'
    check (status in ('submitted', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_edge_accompagnement_programme_requests_user
  on public.edge_accompagnement_programme_requests (user_id, created_at desc);

alter table public.edge_accompagnement_reservations enable row level security;
alter table public.edge_accompagnement_programme_requests enable row level security;

drop policy if exists edge_accompagnement_reservations_select_own on public.edge_accompagnement_reservations;
create policy edge_accompagnement_reservations_select_own
  on public.edge_accompagnement_reservations
  for select
  using (auth.uid() = user_id);

drop policy if exists edge_accompagnement_programme_requests_select_own on public.edge_accompagnement_programme_requests;
create policy edge_accompagnement_programme_requests_select_own
  on public.edge_accompagnement_programme_requests
  for select
  using (auth.uid() = user_id);

comment on table public.edge_accompagnement_reservations is
  'Réservations payantes accompagnement EDGE particulier (coaching, simulation)';

comment on table public.edge_accompagnement_programme_requests is
  'Demandes de programme accompagnement EDGE (devis, sans paiement immédiat)';

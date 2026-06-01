-- Marketplace psychopédagogues BCT (EDGE for Enterprise niveau 3+)

-- Niveau d'offre EDGE for Enterprise (1 = base, 2 = intermédiaire, 3 = marketplace BCT)
alter table public.organizations
  add column if not exists edge_enterprise_tier smallint not null default 1;

alter table public.organizations drop constraint if exists organizations_edge_enterprise_tier_check;
alter table public.organizations
  add constraint organizations_edge_enterprise_tier_check
  check (edge_enterprise_tier between 1 and 3);

comment on column public.organizations.edge_enterprise_tier is
  'Niveau EDGE for Enterprise : 3 = accès marketplace BCT';

-- Praticiens certifiés Beyond (BCT)
create table if not exists public.praticiens_bct (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,

  prenom text not null,
  nom text not null,
  photo_url text,
  titre text,
  biographie text,
  specialites text[] default '{}',
  langues text[] default array['Français'],
  diplomes text[] default '{}',

  tarif_session integer not null,
  duree_session integer not null default 60,

  stripe_account_id text,
  stripe_onboarding_complete boolean not null default false,

  bct_certified boolean not null default false,
  bct_certification_date date,
  bct_badge_id uuid,

  timezone text not null default 'Europe/Paris',

  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended')),
  visible_marketplace boolean not null default false,

  note_moyenne numeric(3, 2) default 0,
  nombre_avis integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint praticiens_bct_tarif_range check (
    tarif_session >= 6000 and tarif_session <= 12000
  ),
  constraint praticiens_bct_user_unique unique (user_id)
);

create index if not exists idx_praticiens_bct_marketplace
  on public.praticiens_bct (status, visible_marketplace)
  where status = 'active' and visible_marketplace = true;

create index if not exists idx_praticiens_bct_user on public.praticiens_bct (user_id);

-- Créneaux
create table if not exists public.praticien_creneaux (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid not null references public.praticiens_bct (id) on delete cascade,
  date date not null,
  heure_debut time not null,
  heure_fin time not null,
  disponible boolean not null default true,
  created_at timestamptz not null default now(),

  unique (praticien_id, date, heure_debut)
);

create index if not exists idx_praticien_creneaux_lookup
  on public.praticien_creneaux (praticien_id, date, disponible);

-- Sessions / réservations
create table if not exists public.sessions_bct (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid not null references public.praticiens_bct (id),
  collaborateur_id uuid not null references auth.users (id),
  organization_id uuid references public.organizations (id) on delete set null,
  creneau_id uuid not null references public.praticien_creneaux (id),

  date_session date not null,
  heure_debut time not null,
  heure_fin time not null,
  duree_minutes integer not null,
  motif text,

  consentement_donnees boolean not null default false,
  consentement_date timestamptz,

  montant_total integer not null,
  commission_beyond integer not null,
  montant_praticien integer not null,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded', 'failed')),

  status text not null default 'confirmee'
    check (status in ('confirmee', 'annulee', 'terminee', 'no_show')),

  notes_praticien text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_bct_collaborateur
  on public.sessions_bct (collaborateur_id, date_session);

create index if not exists idx_sessions_bct_praticien
  on public.sessions_bct (praticien_id, date_session);

create unique index if not exists idx_sessions_bct_payment_intent
  on public.sessions_bct (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists praticiens_bct_updated_at on public.praticiens_bct;
create trigger praticiens_bct_updated_at
  before update on public.praticiens_bct
  for each row execute function public.set_updated_at();

drop trigger if exists sessions_bct_updated_at on public.sessions_bct;
create trigger sessions_bct_updated_at
  before update on public.sessions_bct
  for each row execute function public.set_updated_at();

-- RLS
alter table public.praticiens_bct enable row level security;
alter table public.praticien_creneaux enable row level security;
alter table public.sessions_bct enable row level security;

-- Praticien : son profil
drop policy if exists praticiens_bct_own on public.praticiens_bct;
create policy praticiens_bct_own on public.praticiens_bct
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Marketplace publique (lecture)
drop policy if exists praticiens_bct_public on public.praticiens_bct;
create policy praticiens_bct_public on public.praticiens_bct
  for select
  using (visible_marketplace = true and status = 'active');

-- Super admin (lecture / gestion)
drop policy if exists praticiens_bct_super on public.praticiens_bct;
create policy praticiens_bct_super on public.praticiens_bct
  for all
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and coalesce(sa.is_active, true) = true
    )
  );

-- Créneaux : praticien propriétaire
drop policy if exists praticien_creneaux_own on public.praticien_creneaux;
create policy praticien_creneaux_own on public.praticien_creneaux
  for all
  using (
    praticien_id in (
      select id from public.praticiens_bct where user_id = auth.uid()
    )
  )
  with check (
    praticien_id in (
      select id from public.praticiens_bct where user_id = auth.uid()
    )
  );

-- Créneaux disponibles (lecture marketplace)
drop policy if exists praticien_creneaux_public on public.praticien_creneaux;
create policy praticien_creneaux_public on public.praticien_creneaux
  for select
  using (
    disponible = true
    and praticien_id in (
      select id from public.praticiens_bct
      where visible_marketplace = true and status = 'active'
    )
  );

-- Sessions : collaborateur
drop policy if exists sessions_bct_collaborateur on public.sessions_bct;
create policy sessions_bct_collaborateur on public.sessions_bct
  for select
  using (collaborateur_id = auth.uid());

drop policy if exists sessions_bct_collaborateur_insert on public.sessions_bct;
create policy sessions_bct_collaborateur_insert on public.sessions_bct
  for insert
  with check (collaborateur_id = auth.uid());

-- Sessions : praticien
drop policy if exists sessions_bct_praticien on public.sessions_bct;
create policy sessions_bct_praticien on public.sessions_bct
  for select
  using (
    praticien_id in (
      select id from public.praticiens_bct where user_id = auth.uid()
    )
  );

drop policy if exists sessions_bct_praticien_update on public.sessions_bct;
create policy sessions_bct_praticien_update on public.sessions_bct
  for update
  using (
    praticien_id in (
      select id from public.praticiens_bct where user_id = auth.uid()
    )
  );

-- Sessions : super admin
drop policy if exists sessions_bct_super on public.sessions_bct;
create policy sessions_bct_super on public.sessions_bct
  for all
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and coalesce(sa.is_active, true) = true
    )
  );

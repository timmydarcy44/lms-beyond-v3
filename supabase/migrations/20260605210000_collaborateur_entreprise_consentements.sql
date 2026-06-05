-- Consentement RGPD : partage volontaire des résultats de tests avec l'entreprise / RH

create table if not exists public.collaborateur_entreprise_consentements (
  id uuid primary key default gen_random_uuid(),
  collaborateur_id uuid not null references public.profiles (id) on delete cascade,
  organisation_id uuid not null,
  consentement_donne boolean not null default false,
  consentement_date timestamptz,
  revocation_date timestamptz,
  disc_shared boolean not null default false,
  idmc_shared boolean not null default false,
  soft_skills_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collaborateur_id, organisation_id)
);

create index if not exists collaborateur_entreprise_consent_org_idx
  on public.collaborateur_entreprise_consentements (organisation_id, consentement_donne);

alter table public.collaborateur_entreprise_consentements enable row level security;

drop policy if exists collaborateur_entreprise_consent_own on public.collaborateur_entreprise_consentements;
create policy collaborateur_entreprise_consent_own on public.collaborateur_entreprise_consentements
  for all
  using (auth.uid() = collaborateur_id)
  with check (auth.uid() = collaborateur_id);

grant select, insert, update on public.collaborateur_entreprise_consentements to authenticated;

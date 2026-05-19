-- Entreprise d'accueil (alternance) : pilotage handicap + fiches apprenants.
-- Crée public.apprenants si elle manque (ex. base sans migration 20260412_repair_lms_schema).
-- Exige public.profiles (clé étrangère id).

create table if not exists public.apprenants (
  id uuid primary key references public.profiles (id) on delete cascade,
  synthese_ia_profonde text,
  consentement_rgpd text,
  consentement_rgpd_at timestamptz,
  rqth_uploaded boolean default false,
  school_id uuid,
  onboarding_step smallint default 1,
  updated_at timestamptz not null default now()
);

alter table public.apprenants
  add column if not exists host_company_prospect_id uuid,
  add column if not exists host_company_manual_name text,
  add column if not exists host_company_manual_contact text,
  add column if not exists host_company_manual_address text,
  add column if not exists host_company_manual_opco text;

comment on column public.apprenants.host_company_prospect_id is 'Référence optionnelle vers crm_prospects.id si lien prospect/client.';
comment on column public.apprenants.host_company_manual_name is 'Raison sociale saisie à la main si pas de fiche SIRET.';
comment on column public.apprenants.host_company_manual_contact is 'Contact entreprise / maître d''apprentissage (texte libre).';
comment on column public.apprenants.host_company_manual_address is 'Adresse siège ou complément.';
comment on column public.apprenants.host_company_manual_opco is 'OPCO affiché / corrigé manuellement.';

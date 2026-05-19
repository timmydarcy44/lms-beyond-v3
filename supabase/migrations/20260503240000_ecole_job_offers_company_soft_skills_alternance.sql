-- Offres école : entreprise affichable ou masquée aux apprenants + soft skills ciblés.
-- Profils apprenants : entreprise d'accueil (CRM) + tuteur en entreprise (non bloquant).

alter table public.job_offers
  add column if not exists company_name text;

alter table public.job_offers
  add column if not exists company_hidden_from_learner boolean not null default false;

alter table public.job_offers
  add column if not exists target_soft_skills text[];

comment on column public.job_offers.company_hidden_from_learner is
  'Si true, le nom entreprise ne doit pas être montré côté apprenant sur les vues publiques / matching.';

alter table public.profiles
  add column if not exists host_company_prospect_id uuid references public.crm_prospects (id) on delete set null;

alter table public.profiles
  add column if not exists enterprise_tutor_name text;

alter table public.profiles
  add column if not exists enterprise_tutor_email text;

create index if not exists profiles_host_company_prospect_id_idx on public.profiles (host_company_prospect_id);

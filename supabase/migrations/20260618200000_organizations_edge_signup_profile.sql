-- Profil entreprise EDGE (overlay post-inscription auto-service)

alter table public.organizations
  add column if not exists edge_profile_completed boolean not null default false,
  add column if not exists company_size_band text;

comment on column public.organizations.edge_profile_completed is
  'true après l''overlay post-inscription EDGE (/entreprises/connexion)';

comment on column public.organizations.company_size_band is
  'Tranche effectif (ex. 1-10, 11-50, 51-200, 201-500, 500+)';

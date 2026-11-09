-- Compte entreprise « light » : devis / convention sans module SaaS (tests, skills, etc.)
alter table public.organizations
  add column if not exists formation_only boolean not null default false;

comment on column public.organizations.formation_only is
  'true = compte limité formation (identité + demandes), sans abonnement SaaS';

create index if not exists organizations_formation_only_idx
  on public.organizations (formation_only)
  where formation_only = true;

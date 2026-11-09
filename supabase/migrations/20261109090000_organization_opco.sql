-- OPCO entreprise (devis / convention / demandes formation)
alter table public.organizations
  add column if not exists opco_name text,
  add column if not exists opco_source text;

alter table public.organizations drop constraint if exists organizations_opco_source_check;
alter table public.organizations
  add constraint organizations_opco_source_check check (
    opco_source is null or opco_source in ('cfadock', 'idcc', 'naf', 'manual')
  );

alter table public.formation_dossiers
  add column if not exists opco_name text;

comment on column public.organizations.opco_name is 'OPCO de l’entreprise (résolu via SIRET / IDCC / NAF).';
comment on column public.formation_dossiers.opco_name is 'OPCO figé pour le devis / la convention de ce dossier.';

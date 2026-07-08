-- Propriétaire du contact, données SIRET/OPCO, correction libellés pipeline BTOB

alter table public.crm_pipeline_deals
  add column if not exists contact_owner_email text,
  add column if not exists siret text,
  add column if not exists siren text,
  add column if not exists naf_code text,
  add column if not exists opco_name text;

update public.crm_pipeline_stages
set label = 'Présentation programmée'
where pipeline_type = 'btob' and slug = 'presentation_programmee';

update public.crm_pipeline_stages
set label = 'Démo réalisée'
where pipeline_type = 'btob' and slug = 'demo_realisee';

update public.crm_pipeline_stages
set label = 'Proposition envoyée'
where pipeline_type = 'btob' and slug = 'proposition_envoyee';

create index if not exists idx_crm_pipeline_deals_btob_owner
  on public.crm_pipeline_deals (contact_owner_email)
  where pipeline_type = 'btob';

create index if not exists idx_crm_pipeline_deals_btob_siret
  on public.crm_pipeline_deals (siret)
  where pipeline_type = 'btob' and siret is not null;

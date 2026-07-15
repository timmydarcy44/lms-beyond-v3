alter table public.crm_pipeline_deals
  add column if not exists contact_civility text;

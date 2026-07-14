alter table public.crm_pipeline_deals
  add column if not exists company_creation_date text;

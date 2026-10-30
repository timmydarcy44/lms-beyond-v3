-- Cases Business / School sur chaque entreprise du pipeline.
-- À coller dans le SQL editor Supabase.

alter table public.crm_pipeline_deals
  add column if not exists offers_business boolean not null default true,
  add column if not exists offers_school boolean not null default false;

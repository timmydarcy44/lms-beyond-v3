-- Suivi d'ouverture Resend pour l'email catalogue BTOB

alter table public.crm_pipeline_deals
  add column if not exists catalog_email_resend_id text,
  add column if not exists catalog_email_opened_at timestamptz;

create index if not exists crm_pipeline_deals_catalog_email_resend_id_idx
  on public.crm_pipeline_deals (catalog_email_resend_id)
  where catalog_email_resend_id is not null;

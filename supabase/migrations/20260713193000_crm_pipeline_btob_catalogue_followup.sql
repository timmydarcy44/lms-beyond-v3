-- Relance J+3 après "Mail envoyé + catalogue"

alter table public.crm_pipeline_deals
  add column if not exists catalogue_followup_email_sent_at timestamptz;


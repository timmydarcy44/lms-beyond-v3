-- Mapping décisionnel, lost reasons, NBA suggérée

alter table public.crm_pipeline_deals
  add column if not exists decision_maker_name text,
  add column if not exists champion_name text,
  add column if not exists blocker_name text,
  add column if not exists finance_contact text,
  add column if not exists lost_reason text,
  add column if not exists lost_reason_detail text,
  add column if not exists lost_competitor text,
  add column if not exists next_best_action text;

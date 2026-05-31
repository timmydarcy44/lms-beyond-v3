-- Enrichissement commercial du pipeline BTOB (table crm_pipeline_deals, pipeline_type = 'btob')

alter table public.crm_pipeline_deals
  add column if not exists sector text,
  add column if not exists employee_count text,
  add column if not exists location text,
  add column if not exists priority text default 'standard',
  add column if not exists why_target text,
  add column if not exists training_needs text[] default '{}',
  add column if not exists contact_role text,
  add column if not exists contact_linkedin text,
  add column if not exists company_linkedin text,
  add column if not exists approach_channel text,
  add column if not exists decision_maker_identified boolean default false,
  add column if not exists engagement_score integer default 0,
  add column if not exists last_contact_date date,
  add column if not exists next_action text,
  add column if not exists next_action_date date,
  add column if not exists estimated_budget text,
  add column if not exists estimated_users integer;

update public.crm_pipeline_deals set priority = 'standard' where priority is null;
update public.crm_pipeline_deals set engagement_score = 0 where engagement_score is null;
update public.crm_pipeline_deals set decision_maker_identified = false where decision_maker_identified is null;
update public.crm_pipeline_deals set training_needs = '{}' where training_needs is null;

alter table public.crm_pipeline_deals drop constraint if exists crm_pipeline_deals_priority_check;
alter table public.crm_pipeline_deals
  add constraint crm_pipeline_deals_priority_check
  check (priority in ('haute', 'moyenne', 'standard'));

alter table public.crm_pipeline_deals drop constraint if exists crm_pipeline_deals_engagement_score_check;
alter table public.crm_pipeline_deals
  add constraint crm_pipeline_deals_engagement_score_check
  check (engagement_score between 0 and 3);

create or replace function public.update_crm_pipeline_deals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists crm_pipeline_deals_updated_at on public.crm_pipeline_deals;
create trigger crm_pipeline_deals_updated_at
  before update on public.crm_pipeline_deals
  for each row execute function public.update_crm_pipeline_deals_updated_at();

create index if not exists idx_crm_pipeline_deals_btob_priority
  on public.crm_pipeline_deals (priority)
  where pipeline_type = 'btob';

create index if not exists idx_crm_pipeline_deals_btob_sector
  on public.crm_pipeline_deals (sector)
  where pipeline_type = 'btob';

create index if not exists idx_crm_pipeline_deals_btob_next_action_date
  on public.crm_pipeline_deals (next_action_date)
  where pipeline_type = 'btob';

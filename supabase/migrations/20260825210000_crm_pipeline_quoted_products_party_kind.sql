-- Produits commercial chiffrés + distinction prospect / prescripteur sur les deals.

alter table public.crm_pipeline_deals
  add column if not exists quoted_products jsonb not null default '[]'::jsonb;

alter table public.crm_pipeline_deals
  add column if not exists party_kind text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'crm_pipeline_deals_party_kind_check'
  ) then
    alter table public.crm_pipeline_deals
      add constraint crm_pipeline_deals_party_kind_check
      check (party_kind is null or party_kind in ('prospect', 'prescripteur'));
  end if;
end $$;

-- SIM : traité comme prescripteur (demande produit)
update public.crm_pipeline_deals
set party_kind = 'prescripteur'
where party_kind is null
  and (
    lower(trim(company_name)) = 'sim'
    or lower(company_name) like 'sim %'
    or lower(company_name) like '% sim'
    or lower(company_name) like '% sim %'
  );

comment on column public.crm_pipeline_deals.quoted_products is
  'Lignes produits commercial (licences RH/LMS, recrutement, nevo) — [{id, qty, unit_cents}]';
comment on column public.crm_pipeline_deals.party_kind is
  'prospect | prescripteur — null = prospect (heuristique nom possible côté app)';

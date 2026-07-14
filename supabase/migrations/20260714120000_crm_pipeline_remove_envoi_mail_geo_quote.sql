-- Retire l'étape « envoi mail », ajoute géoloc + formations devis

alter table public.crm_pipeline_deals
  add column if not exists city text,
  add column if not exists zip_code text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists quoted_course_ids uuid[] not null default '{}';

-- Deals encore sur envoi_mail → mail envoyé + catalogue
update public.crm_pipeline_deals
set stage_slug = 'mail_envoye_catalogue'
where pipeline_type = 'btob'
  and stage_slug = 'envoi_mail';

delete from public.crm_pipeline_stages
where pipeline_type = 'btob'
  and slug = 'envoi_mail';

-- Réordonne les étapes BTOB (sans envoi_mail)
update public.crm_pipeline_stages set sort_order = 0 where pipeline_type = 'btob' and slug = 'a_appeler';
update public.crm_pipeline_stages set sort_order = 1 where pipeline_type = 'btob' and slug = 'mail_envoye_catalogue';
update public.crm_pipeline_stages set sort_order = 2 where pipeline_type = 'btob' and slug = 'presentation_programmee';
update public.crm_pipeline_stages set sort_order = 3 where pipeline_type = 'btob' and slug = 'demo_realisee';
update public.crm_pipeline_stages set sort_order = 4 where pipeline_type = 'btob' and slug = 'proposition_a_faire';
update public.crm_pipeline_stages set sort_order = 5 where pipeline_type = 'btob' and slug = 'proposition_envoyee';
update public.crm_pipeline_stages set sort_order = 6 where pipeline_type = 'btob' and slug = 'reussi';
update public.crm_pipeline_stages set sort_order = 7 where pipeline_type = 'btob' and slug = 'echec';

create index if not exists idx_crm_pipeline_deals_btob_naf
  on public.crm_pipeline_deals (naf_code)
  where pipeline_type = 'btob' and naf_code is not null;

create index if not exists idx_crm_pipeline_deals_btob_zip
  on public.crm_pipeline_deals (zip_code)
  where pipeline_type = 'btob' and zip_code is not null;

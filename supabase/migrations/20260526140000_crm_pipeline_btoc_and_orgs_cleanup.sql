-- Pipeline BTOB / BTOC + nettoyage organisations (garder EDGE, Jessica Contentin, Playmakers)

-- ─── Pipeline multi-type ─────────────────────────────────────────────────────
alter table public.crm_pipeline_stages
  add column if not exists pipeline_type text not null default 'btob';

alter table public.crm_pipeline_deals
  add column if not exists pipeline_type text not null default 'btob',
  add column if not exists profile_id uuid references public.profiles (id) on delete cascade,
  add column if not exists source text not null default 'manual';

update public.crm_pipeline_stages set pipeline_type = 'btob' where pipeline_type is null or trim(pipeline_type) = '';
update public.crm_pipeline_deals set pipeline_type = 'btob' where pipeline_type is null or trim(pipeline_type) = '';

alter table public.crm_pipeline_deals drop constraint if exists crm_pipeline_deals_stage_slug_fkey;

alter table public.crm_pipeline_stages drop constraint if exists crm_pipeline_stages_pkey;
alter table public.crm_pipeline_stages add primary key (pipeline_type, slug);

alter table public.crm_pipeline_deals
  add constraint crm_pipeline_deals_stage_fkey
  foreign key (pipeline_type, stage_slug)
  references public.crm_pipeline_stages (pipeline_type, slug)
  on update cascade;

create unique index if not exists crm_pipeline_deals_btoc_profile_uidx
  on public.crm_pipeline_deals (pipeline_type, profile_id)
  where pipeline_type = 'btoc' and profile_id is not null;

insert into public.crm_pipeline_stages (pipeline_type, slug, label, sort_order) values
  ('btoc', 'inscription', 'Inscription', 0),
  ('btoc', 'badge_passe', 'Badge passé', 1),
  ('btoc', 'paiement', 'Paiement', 2),
  ('btob', 'a_appeler', 'A appeler', 0),
  ('btob', 'envoi_mail', 'Envoi mail', 1),
  ('btob', 'presentation_programmee', 'Présentation programmé', 2),
  ('btob', 'demo_realisee', 'Demo réalisé', 3),
  ('btob', 'proposition_a_faire', 'Proposition à faire', 4),
  ('btob', 'proposition_envoyee', 'Proposition envoyé', 5),
  ('btob', 'reussi', 'Réussi', 6),
  ('btob', 'echec', 'Échec', 7)
on conflict (pipeline_type, slug) do update set label = excluded.label, sort_order = excluded.sort_order;

-- ─── Organisations : ne garder que EDGE, Jessica Contentin, Playmakers ───────
do $$
declare
  keep_ids uuid[];
begin
  select array_agg(id) into keep_ids
  from public.organizations o
  where
    lower(trim(coalesce(o.slug, ''))) in ('edgelab', 'edge-lab', 'edge_lab', 'edge')
    or lower(trim(coalesce(o.name, ''))) in ('edge', 'edge lab', 'edge lab')
    or lower(coalesce(o.name, '')) like '%jessica%contentin%'
    or lower(coalesce(o.slug, '')) like '%jessica%contentin%'
    or lower(coalesce(o.name, '')) like '%playmakers%'
    or lower(coalesce(o.slug, '')) like '%playmakers%';

  if keep_ids is null or array_length(keep_ids, 1) is null then
    raise notice 'Aucune organisation à conserver trouvée — suppression ignorée.';
    return;
  end if;

  delete from public.org_memberships where org_id <> all (keep_ids);

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'organization_features'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'organization_features' and column_name = 'org_id'
    ) then
      delete from public.organization_features where org_id <> all (keep_ids);
    end if;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'org_id') then
    execute 'update public.courses set org_id = null where org_id is not null and org_id <> all ($1)' using keep_ids;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'paths' and column_name = 'org_id') then
    execute 'update public.paths set org_id = null where org_id is not null and org_id <> all ($1)' using keep_ids;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'resources' and column_name = 'org_id') then
    execute 'update public.resources set org_id = null where org_id is not null and org_id <> all ($1)' using keep_ids;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tests' and column_name = 'org_id') then
    execute 'update public.tests set org_id = null where org_id is not null and org_id <> all ($1)' using keep_ids;
  end if;

  delete from public.organizations where id <> all (keep_ids);

  raise notice 'Organisations conservées : %', keep_ids;
end $$;

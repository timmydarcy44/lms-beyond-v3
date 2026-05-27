-- Correctif si 20260526140000 a échoué sur resources.org_id (colonne absente)
-- À exécuter seule la partie organisations si le pipeline a déjà été appliqué.

do $$
declare
  keep_ids uuid[];
begin
  select array_agg(id) into keep_ids
  from public.organizations o
  where
    lower(trim(coalesce(o.slug, ''))) in ('edgelab', 'edge-lab', 'edge_lab', 'edge')
    or lower(trim(coalesce(o.name, ''))) in ('edge', 'edge lab')
    or lower(coalesce(o.name, '')) like '%jessica%contentin%'
    or lower(coalesce(o.slug, '')) like '%jessica%contentin%'
    or lower(coalesce(o.name, '')) like '%playmakers%'
    or lower(coalesce(o.slug, '')) like '%playmakers%';

  if keep_ids is null or array_length(keep_ids, 1) is null then
    raise notice 'Aucune organisation à conserver — abandon.';
    return;
  end if;

  delete from public.org_memberships where org_id <> all (keep_ids);

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'organization_features') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'organization_features' and column_name = 'org_id') then
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

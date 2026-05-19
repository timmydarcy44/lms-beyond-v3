-- Backfill org_id for legacy paths
-- Rattache tous les parcours sans org_id à EDGE Lab.

begin;

do $$
declare
  edge_org_id uuid;
begin
  select o.id
  into edge_org_id
  from public.organizations o
  where lower(o.slug) in ('edgelab', 'edge-lab', 'edge_lab')
  order by o.created_at asc nulls last
  limit 1;

  if edge_org_id is null then
    raise exception 'EDGE Lab organization not found (slug edgelab/edge-lab).';
  end if;

  update public.paths
  set org_id = edge_org_id
  where org_id is null;
end $$;

commit;


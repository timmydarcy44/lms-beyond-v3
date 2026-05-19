-- Rattache le compte démo école à l’organisation EDGE Lab :
-- profiles.school_id + org_memberships (admin).
-- Prérequis : ligne `profiles` pour demo@ecole.fr et org slug edgelab / edge-lab.

begin;

do $$
declare
  edge_org_id uuid;
  demo_uid uuid;
begin
  select o.id
  into edge_org_id
  from public.organizations o
  where lower(trim(o.slug)) in ('edgelab', 'edge-lab', 'edge_lab')
  order by o.created_at asc nulls last
  limit 1;

  if edge_org_id is null then
    raise exception 'EDGE Lab : aucune ligne public.organizations (slug edgelab / edge-lab).';
  end if;

  select p.id
  into demo_uid
  from public.profiles p
  where lower(trim(p.email)) = 'demo@ecole.fr'
  limit 1;

  if demo_uid is null then
    raise exception 'Profil introuvable pour demo@ecole.fr (créer Auth + profiles puis relancer la migration ou appliquer manuellement).';
  end if;

  update public.profiles
  set school_id = edge_org_id
  where id = demo_uid;

  insert into public.org_memberships (org_id, user_id, role)
  values (edge_org_id, demo_uid, 'admin')
  on conflict (org_id, user_id) do update
  set role = excluded.role;
end $$;

commit;

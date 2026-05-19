-- =============================================================================
-- Rattacher tuteur@edgebs.fr à l'organisation EDGE (profiles.school_id + org)
-- =============================================================================
-- `profiles.school_id` = `organizations.id` (écosystème école / Beyond Connect).
-- Crée ou met à jour `org_memberships` avec le rôle `tutor`.
--
-- Résolution de l'org « EDGE » (première correspondance) :
--   1) slug edgebs / edge-bs
--   2) slug edgelab / edge-lab / edge_lab (EDGE Lab)
--   3) nom ilike 'EDGE%'
--
-- Prérequis : ligne `public.profiles` pour l’email (compte Auth déjà créé).
-- =============================================================================

begin;

do $$
declare
  edge_org_id uuid;
  tutor_uid uuid;
begin
  select o.id
  into edge_org_id
  from public.organizations o
  where lower(trim(o.slug)) in ('edgebs', 'edge-bs')
  order by o.created_at asc nulls last
  limit 1;

  if edge_org_id is null then
    select o.id
    into edge_org_id
    from public.organizations o
    where lower(trim(o.slug)) in ('edgelab', 'edge-lab', 'edge_lab')
    order by o.created_at asc nulls last
    limit 1;
  end if;

  if edge_org_id is null then
    select o.id
    into edge_org_id
    from public.organizations o
    where lower(o.name) like 'edge%'
    order by o.created_at asc nulls last
    limit 1;
  end if;

  if edge_org_id is null then
    raise exception 'Aucune organisation EDGE trouvée (slug edgebs / edgelab ou nom commençant par EDGE).';
  end if;

  select p.id
  into tutor_uid
  from public.profiles p
  where lower(trim(p.email)) = 'tuteur@edgebs.fr'
  limit 1;

  if tutor_uid is null then
    raise exception 'Profil introuvable pour tuteur@edgebs.fr (créer le compte Auth + profiles puis relancer).';
  end if;

  update public.profiles
  set school_id = edge_org_id
  where id = tutor_uid;

  insert into public.org_memberships (org_id, user_id, role)
  values (edge_org_id, tutor_uid, 'tutor')
  on conflict (org_id, user_id) do update
  set role = excluded.role;

  raise notice 'OK: tuteur@edgebs.fr → school_id = % (org slug/name vérifier dans organizations)', edge_org_id;
end $$;

commit;

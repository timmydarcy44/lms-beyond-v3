-- Crée l'organisation EDGE Lab si elle n'existe pas (slug canonique `edgelab`).
-- Les migrations suivantes / scripts supposent cette ligne (demo école, backfill parcours, etc.).

insert into public.organizations (name, slug, description)
select
  'EDGE',
  'edgelab',
  'Galaxie EDGE — catalogue et espace école (slug URL /g/edgelab/…)'
where not exists (
  select 1
  from public.organizations o
  where lower(trim(o.slug)) in ('edgelab', 'edge-lab', 'edge_lab')
);

-- Affichage : EDGE Lab → EDGE (nom organisation galaxie)
UPDATE public.organizations
SET
  name = 'EDGE',
  description = 'Galaxie EDGE — catalogue et espace école (slug URL /g/edgelab/…)'
WHERE lower(trim(slug)) IN ('edgelab', 'edge-lab', 'edge_lab')
  AND trim(name) = 'EDGE Lab';

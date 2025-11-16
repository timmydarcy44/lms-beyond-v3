-- Script pour vérifier si les ressources sont bien associées au parcours
-- et si elles sont accessibles aux apprenants
-- ===============================================================

-- 1. Vérifier les ressources associées au parcours dans path_resources
SELECT 
  'RESSOURCES ASSOCIEES AU PARCOURS' as "Info",
  pr.path_id,
  pr.resource_id,
  pr.order as "order_in_path",
  r.id,
  r.title,
  r.published,
  r.created_by
FROM public.path_resources pr
LEFT JOIN public.resources r ON pr.resource_id = r.id
WHERE pr.path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0'  -- Remplacez par le path_id de votre parcours
ORDER BY pr.order;

-- 2. Vérifier le path_id du parcours "Négociateur Technico Commercial"
SELECT 
  'PATH ID DU PARCOURS' as "Info",
  id as "path_id",
  title,
  status,
  owner_id,
  creator_id
FROM public.paths
WHERE title LIKE '%Négociateur%' OR title LIKE '%Technico%';

-- 3. Vérifier que l'apprenant j.contentin@laposte.net a accès au parcours
-- Note: On ne peut pas joindre auth.users directement, on utilise profiles
SELECT 
  'ACCES APPRENANT AU PARCOURS' as "Info",
  pp.user_id,
  pp.path_id,
  pr.email,
  pr.full_name,
  pp.progress_percent,
  pp.last_accessed_at
FROM public.path_progress pp
JOIN public.profiles pr ON pp.user_id = pr.id
WHERE pr.email = 'j.contentin@laposte.net'
  AND pp.path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0';  -- Remplacez par le path_id

-- 4. Tester la lecture des ressources depuis path_resources pour cet apprenant
-- (Simule ce que fait getLearnerPathDetail)
SELECT 
  'TEST LECTURE PATH_RESOURCES' as "Info",
  pr.resource_id,
  pr.order
FROM public.path_resources pr
WHERE pr.path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0'  -- Remplacez par le path_id
ORDER BY pr.order;

-- 5. Tester la lecture des détails des ressources (simule la deuxième requête)
SELECT 
  'TEST LECTURE DETAILS RESOURCES' as "Info",
  r.id,
  r.title,
  r.kind,
  r.cover_url,
  r.thumbnail_url,
  r.published
FROM public.resources r
WHERE r.id IN (
  SELECT resource_id 
  FROM public.path_resources 
  WHERE path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0'  -- Remplacez par le path_id
)
AND r.published = true;


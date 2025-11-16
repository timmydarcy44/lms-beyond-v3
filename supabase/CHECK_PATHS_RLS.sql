-- Script pour vérifier les RLS policies de la table paths
-- ===============================================================

-- 1. Vérifier les policies existantes sur paths
SELECT 
  'POLICIES PATHS EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'paths'
ORDER BY policyname;

-- 2. Tester si un apprenant peut lire un parcours assigné
-- Remplacez l'email et le path_id si nécessaire
SELECT 
  'TEST LECTURE PATH' as "Info",
  p.id,
  p.title,
  p.status,
  p.owner_id,
  p.creator_id,
  'Parcours lisible' as "resultat"
FROM public.paths p
WHERE p.id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0'
  AND p.status = 'published';

-- 3. Tester la jointure path_progress + paths
SELECT 
  'TEST JOINTURE PATH_PROGRESS + PATHS' as "Info",
  pp.user_id,
  pp.path_id,
  pp.progress_percent,
  p.id as "path_exists",
  p.title,
  p.status,
  p.owner_id,
  p.creator_id
FROM public.path_progress pp
LEFT JOIN public.paths p ON pp.path_id = p.id
WHERE pp.user_id = (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
);

-- 4. Vérifier si le problème vient de la requête Supabase
-- Cette requête simule ce que fait le code TypeScript
SELECT 
  'TEST REQUETE SIMILAIRE AU CODE' as "Info",
  p.id,
  p.title,
  p.description,
  p.thumbnail_url,
  p.hero_url,
  p.updated_at,
  p.owner_id,
  p.creator_id,
  p.status
FROM public.paths p
WHERE p.id IN (
  SELECT path_id 
  FROM public.path_progress 
  WHERE user_id = (
    SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
  )
)
  AND p.status = 'published';




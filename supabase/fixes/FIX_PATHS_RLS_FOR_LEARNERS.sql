-- Script pour corriger les RLS policies de paths pour les apprenants
-- ===============================================================

-- 1. Vérifier les policies existantes
SELECT 
  'POLICIES PATHS EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as "USING clause"
FROM pg_policies
WHERE tablename = 'paths'
ORDER BY policyname;

-- 2. La policy paths_public_read devrait permettre la lecture de tous les parcours
-- Vérifions si elle existe et fonctionne correctement
-- Si elle n'existe pas ou est trop restrictive, on la recrée

-- Supprimer l'ancienne policy si elle existe et est trop restrictive
DROP POLICY IF EXISTS paths_public_read ON public.paths;
DROP POLICY IF EXISTS paths_learner_read ON public.paths;

-- Créer une policy qui permet aux apprenants de lire les parcours publiés
-- Cette policy devrait déjà exister (paths_public_read using (true))
-- Mais on va créer une version plus explicite pour les apprenants
CREATE POLICY paths_public_read ON public.paths
  FOR SELECT
  USING (
    -- Permettre la lecture si le parcours est publié
    status = 'published'
    -- OU si l'utilisateur est le propriétaire/créateur
    OR owner_id = auth.uid()
    OR creator_id = auth.uid()
    -- OU si l'utilisateur a un enregistrement dans path_progress (parcours assigné)
    OR EXISTS (
      SELECT 1 
      FROM public.path_progress pp 
      WHERE pp.path_id = paths.id 
        AND pp.user_id = auth.uid()
    )
  );

-- Alternative : policy plus simple qui permet de lire tous les parcours publiés
-- (si la première ne fonctionne pas, on peut utiliser celle-ci)
-- DROP POLICY IF EXISTS paths_public_read ON public.paths;
-- CREATE POLICY paths_public_read ON public.paths
--   FOR SELECT
--   USING (status = 'published' OR owner_id = auth.uid() OR creator_id = auth.uid());

-- 3. Vérifier les policies après modification
SELECT 
  'POLICIES APRES MODIFICATION' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as "USING clause"
FROM pg_policies
WHERE tablename = 'paths'
ORDER BY policyname;

-- 4. Test : vérifier qu'un apprenant peut maintenant lire un parcours publié
-- Exécutez cette requête connecté en tant que l'apprenant (j.contentin@laposte.net)
SELECT 
  'TEST LECTURE PATH PAR APPRENANT' as "Info",
  p.id,
  p.title,
  p.status,
  'Lisible' as "resultat"
FROM public.paths p
WHERE p.id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0'
  AND p.status = 'published';


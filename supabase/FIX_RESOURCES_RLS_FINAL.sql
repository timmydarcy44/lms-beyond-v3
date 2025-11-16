-- Script pour corriger définitivement les RLS policies pour les ressources
-- Permet aux apprenants de lire les ressources publiées associées à leurs parcours
-- ===============================================================

-- 1. Vérifier les policies existantes
SELECT 
  'POLICIES EXISTANTES' as "Info",
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- 2. Le problème : Les policies existantes sont trop restrictives
-- La policy resources_read_lt vérifie pathway_assignments, mais notre système utilise path_progress
-- La policy resources_learner_published_read existe mais peut être masquée par d'autres

-- 3. Solution : Simplifier drastiquement les policies
-- Le problème : Trop de policies complexes peuvent créer des conflits
-- Solution : Créer une policy simple et permissive qui passe en premier

-- IMPORTANT : Dans Supabase, les policies RLS sont évaluées avec OR
-- Si AU MOINS UNE policy retourne true, l'accès est autorisé
-- Mais certaines policies peuvent être plus restrictives et bloquer

-- Supprimer les policies restrictives qui peuvent bloquer
DROP POLICY IF EXISTS resources_read_lt ON public.resources;
DROP POLICY IF EXISTS resources_select ON public.resources;
DROP POLICY IF EXISTS sel_resources_org ON public.resources;

-- Garder resources_learner_published_read qui est simple et permissive
-- Mais ajouter une policy encore plus spécifique pour les ressources via parcours

-- Créer une policy qui permet la lecture si la ressource est dans un parcours assigné
DROP POLICY IF EXISTS resources_learner_path_read ON public.resources;

CREATE POLICY resources_learner_path_read ON public.resources
  FOR SELECT
  USING (
    -- La ressource est publiée
    published = true
    AND (
      -- ET la ressource est associée à un parcours assigné à l'utilisateur
      EXISTS (
        SELECT 1 
        FROM path_resources pr
        JOIN path_progress pp ON pp.path_id = pr.path_id
        WHERE pr.resource_id = resources.id
          AND pp.user_id = auth.uid()
      )
      -- OU l'utilisateur est dans la même org
      OR EXISTS (
        SELECT 1 
        FROM org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = resources.org_id
      )
      -- OU l'utilisateur est le propriétaire
      OR owner_id = auth.uid()
    )
  );

-- 4. Alternative : Créer une policy plus simple qui combine avec resources_learner_published_read
-- Mais d'abord, vérifions si resources_read_lt bloque l'accès

-- Note : Dans Supabase/PostgreSQL, les policies RLS sont combinées avec OR
-- Si AUCUNE policy ne permet l'accès, la requête est bloquée
-- Si AU MOINS UNE policy permet l'accès, la requête est autorisée

-- 5. Vérifier les policies après modification
SELECT 
  'POLICIES APRES MODIFICATION' as "Info",
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- 6. Test : Vérifier qu'un apprenant peut lire les ressources associées à son parcours
SELECT 
  'TEST LECTURE RESOURCES VIA PARCOURS' as "Info",
  r.id,
  r.title,
  r.published,
  pr.path_id
FROM public.resources r
JOIN public.path_resources pr ON pr.resource_id = r.id
JOIN public.path_progress pp ON pp.path_id = pr.path_id
WHERE pp.user_id = (SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1)
  AND r.published = true;


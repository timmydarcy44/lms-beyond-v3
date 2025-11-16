-- Script pour vérifier et corriger les RLS policies pour les ressources
-- Permet aux apprenants de lire les ressources publiées
-- ===============================================================

-- 1. Vérifier les policies existantes pour resources
SELECT 
  'POLICIES EXISTANTES RESOURCES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- 2. Vérifier la structure de la table resources
SELECT 
  'STRUCTURE TABLE RESOURCES' as "Info",
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'resources'
  AND column_name IN ('status', 'published', 'created_by', 'owner_id', 'creator_id')
ORDER BY column_name;

-- 3. Supprimer les anciennes policies qui pourraient poser problème
DROP POLICY IF EXISTS resources_public_published ON public.resources;
DROP POLICY IF EXISTS resources_learner_read ON public.resources;
DROP POLICY IF EXISTS resources_learner_published_read ON public.resources;

-- 4. Créer une policy SELECT pour permettre la lecture des ressources publiées
-- Cette policy doit permettre à TOUS les utilisateurs (y compris les apprenants) de lire les ressources publiées
CREATE POLICY resources_learner_published_read ON public.resources
  FOR SELECT
  USING (published = true);

-- 5. Vérifier que la policy a été créée
SELECT 
  'POLICIES APRES CREATION' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- 6. Test : vérifier qu'un utilisateur peut lire les ressources publiées
-- Note: Cette requête simule ce que fait l'apprenant
SELECT 
  'TEST LECTURE RESOURCES PUBLIEES' as "Info",
  COUNT(*) as "resources_count"
FROM public.resources
WHERE published = true;

-- 7. Test avec des IDs spécifiques (simule getLearnerPathDetail)
-- Remplacez les IDs par ceux de vos ressources associées au parcours
SELECT 
  'TEST LECTURE RESOURCES PAR IDS' as "Info",
  r.id,
  r.title,
  r.published
FROM public.resources r
WHERE r.id IN (
  SELECT resource_id 
  FROM public.path_resources 
  WHERE path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0'  -- Remplacez par votre path_id
)
AND r.published = true;




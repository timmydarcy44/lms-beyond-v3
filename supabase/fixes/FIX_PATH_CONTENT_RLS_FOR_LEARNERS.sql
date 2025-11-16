-- Script pour corriger les RLS policies des tables de liaison path_*
-- Permet aux apprenants de lire les contenus associés aux parcours qui leur sont assignés
-- ===============================================================

-- 1. Vérifier les policies existantes
SELECT 
  'POLICIES EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('path_courses', 'path_tests', 'path_resources')
ORDER BY tablename, policyname;

-- 2. Ajouter des policies SELECT pour les apprenants sur path_courses
DROP POLICY IF EXISTS path_courses_learner_read ON public.path_courses;
CREATE POLICY path_courses_learner_read ON public.path_courses
  FOR SELECT
  USING (
    -- Permettre la lecture si l'utilisateur a un enregistrement dans path_progress
    -- pour le parcours associé
    EXISTS (
      SELECT 1 
      FROM public.path_progress pp 
      WHERE pp.path_id = path_courses.path_id 
        AND pp.user_id = auth.uid()
    )
    -- OU si l'utilisateur est admin/instructor
    OR EXISTS (
      SELECT 1 
      FROM public.profiles pr 
      WHERE pr.id = auth.uid() 
        AND pr.role IN ('admin', 'instructor')
    )
  );

-- 3. Ajouter des policies SELECT pour les apprenants sur path_tests
DROP POLICY IF EXISTS path_tests_learner_read ON public.path_tests;
CREATE POLICY path_tests_learner_read ON public.path_tests
  FOR SELECT
  USING (
    -- Permettre la lecture si l'utilisateur a un enregistrement dans path_progress
    -- pour le parcours associé
    EXISTS (
      SELECT 1 
      FROM public.path_progress pp 
      WHERE pp.path_id = path_tests.path_id 
        AND pp.user_id = auth.uid()
    )
    -- OU si l'utilisateur est admin/instructor
    OR EXISTS (
      SELECT 1 
      FROM public.profiles pr 
      WHERE pr.id = auth.uid() 
        AND pr.role IN ('admin', 'instructor')
    )
  );

-- 4. Ajouter des policies SELECT pour les apprenants sur path_resources
DROP POLICY IF EXISTS path_resources_learner_read ON public.path_resources;
CREATE POLICY path_resources_learner_read ON public.path_resources
  FOR SELECT
  USING (
    -- Permettre la lecture si l'utilisateur a un enregistrement dans path_progress
    -- pour le parcours associé
    EXISTS (
      SELECT 1 
      FROM public.path_progress pp 
      WHERE pp.path_id = path_resources.path_id 
        AND pp.user_id = auth.uid()
    )
    -- OU si l'utilisateur est admin/instructor
    OR EXISTS (
      SELECT 1 
      FROM public.profiles pr 
      WHERE pr.id = auth.uid() 
        AND pr.role IN ('admin', 'instructor')
    )
  );

-- 5. Vérifier les policies après modification
SELECT 
  'POLICIES APRES MODIFICATION' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('path_courses', 'path_tests', 'path_resources')
ORDER BY tablename, policyname;

-- 6. Test : vérifier qu'un apprenant peut lire les contenus d'un parcours assigné
-- Remplacez le path_id et l'email si nécessaire
SELECT 
  'TEST LECTURE PATH_COURSES' as "Info",
  COUNT(*) as "courses_count"
FROM public.path_courses pc
WHERE pc.path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0';

SELECT 
  'TEST LECTURE PATH_TESTS' as "Info",
  COUNT(*) as "tests_count"
FROM public.path_tests pt
WHERE pt.path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0';

SELECT 
  'TEST LECTURE PATH_RESOURCES' as "Info",
  COUNT(*) as "resources_count"
FROM public.path_resources pr
WHERE pr.path_id = '9c2643ee-87d3-4c13-bf79-ba2e77b32af0';





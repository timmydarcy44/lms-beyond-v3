-- ============================================
-- Script pour permettre aux formateurs d'assigner du contenu à leurs apprenants
-- ============================================
-- Problème : Les RLS policies bloquent les insertions des formateurs dans :
-- - enrollments
-- - path_progress
-- - resource_views
-- - test_attempts
-- ============================================

-- 1. Policy pour enrollments : Les formateurs peuvent assigner des cours à leurs apprenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'enrollments' 
      AND policyname = 'enrollments_instructor_assign'
  ) THEN
    CREATE POLICY enrollments_instructor_assign ON public.enrollments
      FOR INSERT
      WITH CHECK (
        -- Le formateur peut assigner un cours à un apprenant si :
        -- 1. Le cours appartient au formateur
        EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.id = enrollments.course_id
            AND (c.creator_id = auth.uid() OR c.owner_id = auth.uid())
        )
        -- 2. L'utilisateur est un formateur (vérifier dans profiles OU org_memberships)
        AND (
          -- Option A : Le formateur a role = 'instructor' dans profiles
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'instructor'
          )
          -- Option B : Le formateur a role = 'instructor' dans org_memberships
          OR EXISTS (
            SELECT 1 FROM public.org_memberships om
            WHERE om.user_id = auth.uid()
              AND om.role = 'instructor'
          )
        )
        -- 3. L'apprenant est dans une organisation où le formateur est instructor
        -- Utiliser learner_id si la colonne existe, sinon user_id
        AND EXISTS (
          SELECT 1 FROM public.org_memberships om_learner
          JOIN public.org_memberships om_instructor 
            ON om_learner.org_id = om_instructor.org_id
          WHERE om_learner.user_id = COALESCE(enrollments.learner_id, enrollments.user_id)
            AND om_learner.role = 'learner'
            AND om_instructor.user_id = auth.uid()
            AND (
              om_instructor.role = 'instructor' 
              OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role = 'instructor'
              )
            )
        )
      );
    
    RAISE NOTICE 'Policy enrollments_instructor_assign créée';
  ELSE
    RAISE NOTICE 'Policy enrollments_instructor_assign existe déjà';
  END IF;
END $$;

-- 2. Policy pour path_progress : Les formateurs peuvent assigner des parcours à leurs apprenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'path_progress' 
      AND policyname = 'path_progress_instructor_assign'
  ) THEN
    CREATE POLICY path_progress_instructor_assign ON public.path_progress
      FOR INSERT
      WITH CHECK (
        -- Le formateur peut assigner un parcours à un apprenant si :
        -- 1. Le parcours appartient au formateur
        EXISTS (
          SELECT 1 FROM public.paths p
          WHERE p.id = path_progress.path_id
            AND p.owner_id = auth.uid()
        )
        -- 2. L'apprenant est dans une organisation où le formateur est instructor
        AND EXISTS (
          SELECT 1 FROM public.org_memberships om_learner
          JOIN public.org_memberships om_instructor 
            ON om_learner.org_id = om_instructor.org_id
          WHERE om_learner.user_id = path_progress.user_id
            AND om_learner.role = 'learner'
            AND om_instructor.user_id = auth.uid()
            AND om_instructor.role = 'instructor'
        )
      );
    
    RAISE NOTICE 'Policy path_progress_instructor_assign créée';
  ELSE
    RAISE NOTICE 'Policy path_progress_instructor_assign existe déjà';
  END IF;
END $$;

-- 3. Policy pour resource_views : Les formateurs peuvent assigner des ressources à leurs apprenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'resource_views' 
      AND policyname = 'resource_views_instructor_assign'
  ) THEN
    CREATE POLICY resource_views_instructor_assign ON public.resource_views
      FOR INSERT
      WITH CHECK (
        -- Le formateur peut assigner une ressource à un apprenant si :
        -- 1. La ressource appartient au formateur (created_by est la colonne qui existe)
        EXISTS (
          SELECT 1 FROM public.resources r
          WHERE r.id = resource_views.resource_id
            AND r.created_by = auth.uid()
        )
        -- 2. L'apprenant est dans une organisation où le formateur est instructor
        AND EXISTS (
          SELECT 1 FROM public.org_memberships om_learner
          JOIN public.org_memberships om_instructor 
            ON om_learner.org_id = om_instructor.org_id
          WHERE om_learner.user_id = resource_views.user_id
            AND om_learner.role = 'learner'
            AND om_instructor.user_id = auth.uid()
            AND om_instructor.role = 'instructor'
        )
      );
    
    RAISE NOTICE 'Policy resource_views_instructor_assign créée';
  ELSE
    RAISE NOTICE 'Policy resource_views_instructor_assign existe déjà';
  END IF;
END $$;

-- 4. Policy pour test_attempts : Les formateurs peuvent assigner des tests à leurs apprenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'test_attempts' 
      AND policyname = 'test_attempts_instructor_assign'
  ) THEN
    CREATE POLICY test_attempts_instructor_assign ON public.test_attempts
      FOR INSERT
      WITH CHECK (
        -- Le formateur peut assigner un test à un apprenant si :
        -- 1. Le test appartient au formateur (created_by est la colonne qui existe)
        EXISTS (
          SELECT 1 FROM public.tests t
          WHERE t.id = test_attempts.test_id
            AND t.created_by = auth.uid()
        )
        -- 2. L'apprenant est dans une organisation où le formateur est instructor
        AND EXISTS (
          SELECT 1 FROM public.org_memberships om_learner
          JOIN public.org_memberships om_instructor 
            ON om_learner.org_id = om_instructor.org_id
          WHERE om_learner.user_id = test_attempts.user_id
            AND om_learner.role = 'learner'
            AND om_instructor.user_id = auth.uid()
            AND om_instructor.role = 'instructor'
        )
      );
    
    RAISE NOTICE 'Policy test_attempts_instructor_assign créée';
  ELSE
    RAISE NOTICE 'Policy test_attempts_instructor_assign existe déjà';
  END IF;
END $$;

-- Vérification
SELECT 
  'POLICIES CRÉÉES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE policyname IN (
  'enrollments_instructor_assign',
  'path_progress_instructor_assign',
  'resource_views_instructor_assign',
  'test_attempts_instructor_assign'
)
ORDER BY tablename, policyname;


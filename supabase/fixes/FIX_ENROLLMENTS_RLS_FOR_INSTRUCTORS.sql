-- ============================================
-- CORRECTION DE LA POLICY RLS ENROLLMENTS POUR LES FORMATEURS
-- ============================================
-- Problème : La policy vérifie uniquement org_memberships.role = 'instructor'
-- Mais les formateurs peuvent avoir role = 'instructor' dans profiles
-- et role = 'learner' dans org_memberships
-- Solution : Vérifier aussi le rôle dans profiles
-- ============================================

-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS enrollments_instructor_assign ON public.enrollments;

-- Recréer la policy avec vérification du rôle dans profiles ET org_memberships
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
    -- Utiliser COALESCE pour supporter learner_id (si existe) ou user_id
    AND EXISTS (
      SELECT 1 FROM public.org_memberships om_learner
      JOIN public.org_memberships om_instructor 
        ON om_learner.org_id = om_instructor.org_id
      WHERE om_learner.user_id = COALESCE(enrollments.learner_id, enrollments.user_id)
        AND om_learner.role = 'learner'
        AND om_instructor.user_id = auth.uid()
        AND (om_instructor.role = 'instructor' OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'instructor'
        ))
    )
  );

-- Ajouter aussi une policy pour UPDATE (au cas où)
DROP POLICY IF EXISTS enrollments_instructor_update ON public.enrollments;

CREATE POLICY enrollments_instructor_update ON public.enrollments
  FOR UPDATE
  USING (
    -- Le formateur peut modifier un enrollment si :
    -- 1. Le cours appartient au formateur
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = enrollments.course_id
        AND (c.creator_id = auth.uid() OR c.owner_id = auth.uid())
    )
    -- 2. L'utilisateur est un formateur
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'instructor'
      )
      OR EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.role = 'instructor'
      )
    )
  )
  WITH CHECK (
    -- Même vérifications pour WITH CHECK
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = enrollments.course_id
        AND (c.creator_id = auth.uid() OR c.owner_id = auth.uid())
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'instructor'
      )
      OR EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.role = 'instructor'
      )
    )
  );

-- Vérification
SELECT 
  'POLICIES CRÉÉES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'enrollments'
  AND policyname IN ('enrollments_instructor_assign', 'enrollments_instructor_update')
ORDER BY policyname;

RAISE NOTICE '✓ Policies enrollments corrigées pour supporter les formateurs avec role dans profiles';




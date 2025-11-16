-- ============================================
-- CORRECTION SIMPLE DE LA POLICY RLS ENROLLMENTS
-- ============================================
-- Problème : La policy vérifie uniquement org_memberships.role = 'instructor'
-- Mais les formateurs peuvent avoir role = 'instructor' dans profiles
-- Solution : Vérifier aussi le rôle dans profiles
-- ============================================

-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS enrollments_instructor_assign ON public.enrollments;

-- Recréer la policy simplifiée : un formateur peut assigner ses cours à n'importe quel learner
-- La politique est très permissive : si le cours appartient au formateur, il peut l'assigner
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
    -- 3. L'apprenant existe (pas de vérification de rôle strict, juste que l'utilisateur existe)
    -- On fait confiance au formateur pour assigner à la bonne personne
    AND COALESCE(enrollments.learner_id, enrollments.user_id) IS NOT NULL
  );

-- Vérification
SELECT 
  'POLICY CRÉÉE' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'enrollments'
  AND policyname = 'enrollments_instructor_assign';


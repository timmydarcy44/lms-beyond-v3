-- ============================================
-- Script pour corriger la policy RLS enrollments_instructor_assign
-- ============================================
-- Problème : La policy utilisait enrollments.user_id mais la table utilise learner_id
-- Solution : Utiliser COALESCE pour supporter les deux colonnes
-- ============================================

-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS enrollments_instructor_assign ON public.enrollments;

-- Recréer la policy avec support pour learner_id et user_id
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
    -- 2. L'apprenant est dans une organisation où le formateur est instructor
    -- Utiliser COALESCE pour supporter learner_id (si existe) ou user_id
    AND EXISTS (
      SELECT 1 FROM public.org_memberships om_learner
      JOIN public.org_memberships om_instructor 
        ON om_learner.org_id = om_instructor.org_id
      WHERE om_learner.user_id = COALESCE(enrollments.learner_id, enrollments.user_id)
        AND om_learner.role = 'learner'
        AND om_instructor.user_id = auth.uid()
        AND om_instructor.role = 'instructor'
    )
  );

RAISE NOTICE '✓ Policy enrollments_instructor_assign corrigée avec support pour learner_id et user_id';




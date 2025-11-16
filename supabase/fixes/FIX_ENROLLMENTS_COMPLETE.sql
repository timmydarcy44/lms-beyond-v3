-- ============================================
-- CORRECTION COMPLÈTE DE LA TABLE ENROLLMENTS
-- ============================================
-- Ce script :
-- 1. Corrige la policy RLS pour utiliser learner_id
-- 2. Ajoute une contrainte UNIQUE sur (learner_id, course_id) pour permettre les upserts
-- 3. Synchronise user_id avec learner_id si nécessaire
-- ============================================

-- ============================================
-- 1. CORRIGER LA POLICY RLS
-- ============================================
DROP POLICY IF EXISTS enrollments_instructor_assign ON public.enrollments;

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
    -- IMPORTANT : Utiliser learner_id (colonne NOT NULL avec FK)
    AND EXISTS (
      SELECT 1 FROM public.org_memberships om_learner
      JOIN public.org_memberships om_instructor 
        ON om_learner.org_id = om_instructor.org_id
      WHERE om_learner.user_id = enrollments.learner_id
        AND om_learner.role = 'learner'
        AND om_instructor.user_id = auth.uid()
        AND om_instructor.role = 'instructor'
    )
  );

RAISE NOTICE '✓ Policy enrollments_instructor_assign corrigée pour utiliser learner_id';

-- ============================================
-- 2. AJOUTER CONTRAINTE UNIQUE POUR UPSERTS
-- ============================================
-- La table a une PK sur 'id', mais on a besoin d'une contrainte unique
-- sur (learner_id, course_id) pour permettre les upserts
DO $$
BEGIN
  -- Vérifier si la contrainte existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'enrollments'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'enrollments_learner_course_unique'
  ) THEN
    -- Créer la contrainte unique
    ALTER TABLE public.enrollments
    ADD CONSTRAINT enrollments_learner_course_unique 
    UNIQUE (learner_id, course_id);
    
    RAISE NOTICE '✓ Contrainte UNIQUE ajoutée sur (learner_id, course_id)';
  ELSE
    RAISE NOTICE 'Contrainte UNIQUE existe déjà';
  END IF;
END $$;

-- ============================================
-- 3. SYNCHRONISER user_id AVEC learner_id
-- ============================================
-- Si user_id est NULL mais learner_id existe, copier learner_id dans user_id
-- (pour compatibilité avec le code qui pourrait utiliser user_id)
DO $$
BEGIN
  UPDATE public.enrollments
  SET user_id = learner_id
  WHERE user_id IS NULL AND learner_id IS NOT NULL;
  
  IF FOUND THEN
    RAISE NOTICE '✓ Synchronisé user_id avec learner_id pour % lignes', ROW_COUNT;
  ELSE
    RAISE NOTICE 'Aucune synchronisation nécessaire';
  END IF;
END $$;

-- ============================================
-- 4. VÉRIFICATION
-- ============================================
SELECT 
  'VÉRIFICATION' as "Type",
  'enrollments' as "Table",
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_name = 'enrollments' 
     AND constraint_name = 'enrollments_learner_course_unique') as "Contrainte Unique",
  (SELECT COUNT(*) FROM pg_policies
   WHERE tablename = 'enrollments'
     AND policyname = 'enrollments_instructor_assign') as "Policy RLS";

RAISE NOTICE '✓ Correction de enrollments terminée !';





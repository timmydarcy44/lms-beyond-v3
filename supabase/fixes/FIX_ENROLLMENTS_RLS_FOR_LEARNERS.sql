-- ============================================
-- Ajouter RLS policy pour que les apprenants puissent voir leurs propres enrollments
-- ============================================

-- Vérifier si une policy existe déjà pour les apprenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'enrollments'
      AND policyname = 'enrollments_learner_read_own'
  ) THEN
    -- Policy pour que les apprenants puissent lire leurs propres enrollments
    CREATE POLICY enrollments_learner_read_own ON public.enrollments
      FOR SELECT
      USING (learner_id = auth.uid());

    RAISE NOTICE '✓ Policy enrollments_learner_read_own créée';
  ELSE
    RAISE NOTICE 'Policy enrollments_learner_read_own existe déjà';
  END IF;
END $$;

-- Vérification
SELECT 
  'VÉRIFICATION' as "Type",
  tablename as "Table",
  policyname as "Policy",
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'enrollments'
ORDER BY policyname;

RAISE NOTICE '✓ Vérification des policies enrollments terminée';





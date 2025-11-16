-- ============================================
-- CORRECTION DE LA RÉCURSION INFINIE DANS drive_consigne
-- ============================================
-- Erreur: infinite recursion detected in policy for relation "drive_consigne"
-- ============================================

-- 1. Vérifier si la table drive_consigne existe
SELECT 
  json_build_object(
    'type', 'TABLE_CHECK',
    'drive_consigne_exists', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'drive_consigne'
    ),
    'drive_documents_exists', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'drive_documents'
    )
  ) as result;

-- 2. Lister les politiques RLS sur drive_consigne
SELECT 
  json_build_object(
    'type', 'CURRENT_POLICIES',
    'policies', json_agg(
      json_build_object(
        'policyname', policyname,
        'cmd', cmd,
        'qual', qual,
        'with_check', with_check
      )
    )
  ) as result
FROM pg_policies
WHERE tablename = 'drive_consigne';

-- 3. Supprimer les politiques problématiques qui causent la récursion
DO $$
BEGIN
  DROP POLICY IF EXISTS "drive_consigne_select" ON public.drive_consigne;
  DROP POLICY IF EXISTS "drive_consigne_instructor_read" ON public.drive_consigne;
  DROP POLICY IF EXISTS "drive_consigne_learner_read" ON public.drive_consigne;
  DROP POLICY IF EXISTS "drive_consigne_all" ON public.drive_consigne;
  RAISE NOTICE 'Politiques drive_consigne supprimées';
END $$;

-- 4. Créer une politique simple sans récursion (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'drive_consigne'
  ) THEN
    -- Supprimer la politique si elle existe déjà
    DROP POLICY IF EXISTS "drive_consigne_instructor_select" ON public.drive_consigne;
    -- Créer la nouvelle politique
    CREATE POLICY "drive_consigne_instructor_select"
      ON public.drive_consigne FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'instructor'
        )
      );
    RAISE NOTICE 'Politique drive_consigne_instructor_select créée';
  END IF;
END $$;

-- 5. Vérifier aussi les politiques sur drive_documents
SELECT 
  json_build_object(
    'type', 'DRIVE_DOCUMENTS_POLICIES',
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'qual', qual,
          'with_check', with_check
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_policies
WHERE tablename = 'drive_documents';

-- 6. Si drive_documents a aussi des problèmes, les corriger
DO $$
BEGIN
  DROP POLICY IF EXISTS "drive_documents_select" ON public.drive_documents;
  DROP POLICY IF EXISTS "drive_documents_instructor_read" ON public.drive_documents;
  RAISE NOTICE 'Politiques drive_documents supprimées';
END $$;

-- Politique simple pour les formateurs (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'drive_documents'
  ) THEN
    -- Supprimer la politique si elle existe déjà
    DROP POLICY IF EXISTS "drive_documents_instructor_select" ON public.drive_documents;
    -- Créer la nouvelle politique
    CREATE POLICY "drive_documents_instructor_select"
      ON public.drive_documents FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'instructor'
        )
      );
    RAISE NOTICE 'Politique drive_documents_instructor_select créée';
  END IF;
END $$;

-- 7. Résumé final
SELECT 
  json_build_object(
    'type', 'SUMMARY',
    'drive_consigne_policies_removed', TRUE,
    'drive_consigne_policy_created', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'drive_consigne' 
      AND policyname = 'drive_consigne_instructor_select'
    ),
    'drive_documents_policies_removed', TRUE,
    'drive_documents_policy_created', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'drive_documents' 
      AND policyname = 'drive_documents_instructor_select'
    ),
    'status', 'Correction terminée'
  ) as result;


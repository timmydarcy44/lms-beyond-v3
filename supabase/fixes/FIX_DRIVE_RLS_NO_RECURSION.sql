-- ============================================
-- CORRECTION FINALE DE LA RÉCURSION INFINIE
-- ============================================
-- Le problème: La politique vérifie profiles.role qui peut avoir sa propre RLS
-- Solution: Utiliser une fonction SECURITY DEFINER ou vérifier directement le JWT
-- ============================================

-- 1. Supprimer toutes les politiques existantes sur drive_consigne
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Supprimer toutes les politiques
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'drive_consigne'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.drive_consigne', policy_record.policyname);
  END LOOP;
  RAISE NOTICE 'Toutes les politiques drive_consigne supprimées';
END $$;

-- 2. Créer une fonction SECURITY DEFINER pour vérifier si l'utilisateur est instructor
-- Cela évite la récursion car la fonction s'exécute avec les privilèges du créateur
CREATE OR REPLACE FUNCTION public.is_user_instructor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'instructor'
  );
END;
$$;

-- 3. Créer une politique simple qui utilise la fonction SECURITY DEFINER
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'drive_consigne'
  ) THEN
    CREATE POLICY "drive_consigne_instructor_select"
      ON public.drive_consigne FOR SELECT
      USING (public.is_user_instructor());
    RAISE NOTICE 'Politique drive_consigne_instructor_select créée avec fonction SECURITY DEFINER';
  END IF;
END $$;

-- 4. Faire la même chose pour drive_documents
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Supprimer toutes les politiques existantes
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'drive_documents'
    AND policyname LIKE '%instructor%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.drive_documents', policy_record.policyname);
  END LOOP;
  RAISE NOTICE 'Politiques drive_documents supprimées';
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'drive_documents'
  ) THEN
    CREATE POLICY "drive_documents_instructor_select"
      ON public.drive_documents FOR SELECT
      USING (public.is_user_instructor());
    RAISE NOTICE 'Politique drive_documents_instructor_select créée avec fonction SECURITY DEFINER';
  END IF;
END $$;

-- 5. Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.is_user_instructor() TO authenticated;

-- 6. Résumé
SELECT 
  json_build_object(
    'type', 'SUMMARY',
    'function_created', EXISTS(
      SELECT 1 FROM pg_proc 
      WHERE proname = 'is_user_instructor' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ),
    'drive_consigne_policy', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'drive_consigne' 
      AND policyname = 'drive_consigne_instructor_select'
    ),
    'drive_documents_policy', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'drive_documents' 
      AND policyname = 'drive_documents_instructor_select'
    ),
    'status', 'Correction terminée avec fonction SECURITY DEFINER'
  ) as result;


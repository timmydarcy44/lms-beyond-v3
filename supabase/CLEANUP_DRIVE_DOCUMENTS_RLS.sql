-- ============================================
-- NETTOYER LES POLICIES EN DOUBLE
-- ============================================

-- Supprimer toutes les policies existantes pour repartir à zéro
DROP POLICY IF EXISTS "drive_documents_author" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_author_insert" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_insert_author" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_select_author" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_select_shared" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_select_instructor" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_instructor_select" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_read" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_update" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_update_author" ON public.drive_documents;

-- Recréer les policies essentielles (sans doublons)
-- 1. SELECT : Les auteurs peuvent voir leurs propres documents
CREATE POLICY "drive_documents_select_author"
  ON public.drive_documents FOR SELECT
  USING (author_id = auth.uid());

-- 2. SELECT : Les formateurs peuvent voir les documents partagés avec eux
CREATE POLICY "drive_documents_select_shared"
  ON public.drive_documents FOR SELECT
  USING (shared_with = auth.uid());

-- 3. SELECT : Les formateurs peuvent voir les documents de leurs apprenants assignés (status = 'shared')
CREATE POLICY "drive_documents_select_instructor"
  ON public.drive_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.get_instructor_learners(auth.uid()) gl
      WHERE gl.learner_id = drive_documents.author_id
      AND drive_documents.status = 'shared'
    )
  );

-- 4. INSERT : Les utilisateurs peuvent créer leurs propres documents
CREATE POLICY "drive_documents_insert_author"
  ON public.drive_documents FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- 5. UPDATE : Les auteurs peuvent mettre à jour leurs propres documents
CREATE POLICY "drive_documents_update_author"
  ON public.drive_documents FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Vérifier les policies finales
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'drive_documents'
ORDER BY policyname;









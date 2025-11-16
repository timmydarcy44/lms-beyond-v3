-- ============================================
-- RLS POLICIES POUR drive_documents
-- ============================================

-- Activer RLS sur drive_documents si ce n'est pas déjà fait
ALTER TABLE public.drive_documents ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "drive_documents_select_author" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_select_shared" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_select_instructor" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_insert_author" ON public.drive_documents;
DROP POLICY IF EXISTS "drive_documents_update_author" ON public.drive_documents;

-- 1. Policy SELECT : Les auteurs peuvent voir leurs propres documents
CREATE POLICY "drive_documents_select_author"
  ON public.drive_documents FOR SELECT
  USING (author_id = auth.uid());

-- 2. Policy SELECT : Les formateurs peuvent voir les documents partagés avec eux
CREATE POLICY "drive_documents_select_shared"
  ON public.drive_documents FOR SELECT
  USING (shared_with = auth.uid());

-- 3. Policy SELECT : Les formateurs peuvent voir les documents de leurs apprenants assignés
-- Utiliser la fonction get_instructor_learners pour éviter la récursion RLS
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

-- 4. Policy INSERT : Les utilisateurs peuvent créer leurs propres documents
CREATE POLICY "drive_documents_insert_author"
  ON public.drive_documents FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- 5. Policy UPDATE : Les auteurs peuvent mettre à jour leurs propres documents
CREATE POLICY "drive_documents_update_author"
  ON public.drive_documents FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Vérifier les policies créées
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




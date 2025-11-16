-- ============================================
-- RLS POLICIES POUR drive_folders
-- ============================================

-- Activer RLS sur drive_folders si ce n'est pas déjà fait
ALTER TABLE public.drive_folders ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "drive_folders_select_owner" ON public.drive_folders;
DROP POLICY IF EXISTS "drive_folders_insert_owner" ON public.drive_folders;
DROP POLICY IF EXISTS "drive_folders_update_owner" ON public.drive_folders;
DROP POLICY IF EXISTS "drive_folders_delete_owner" ON public.drive_folders;

-- 1. Policy SELECT : Les utilisateurs peuvent voir leurs propres dossiers
CREATE POLICY "drive_folders_select_owner"
  ON public.drive_folders FOR SELECT
  USING (owner_id = auth.uid());

-- 2. Policy INSERT : Les utilisateurs peuvent créer leurs propres dossiers
CREATE POLICY "drive_folders_insert_owner"
  ON public.drive_folders FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- 3. Policy UPDATE : Les utilisateurs peuvent mettre à jour leurs propres dossiers
CREATE POLICY "drive_folders_update_owner"
  ON public.drive_folders FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 4. Policy DELETE : Les utilisateurs peuvent supprimer leurs propres dossiers
CREATE POLICY "drive_folders_delete_owner"
  ON public.drive_folders FOR DELETE
  USING (owner_id = auth.uid());

-- Commentaire
COMMENT ON TABLE public.drive_folders IS 'Dossiers pour organiser les documents du drive. Les utilisateurs peuvent voir et gérer uniquement leurs propres dossiers.';


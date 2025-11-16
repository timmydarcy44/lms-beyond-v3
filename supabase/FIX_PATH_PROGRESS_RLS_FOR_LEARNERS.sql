-- Script pour corriger les RLS policies de path_progress
-- Permet aux apprenants de lire leurs propres parcours assignés
-- ===============================================================

-- 1. Vérifier les policies existantes
SELECT 
  'POLICIES EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'path_progress'
ORDER BY policyname;

-- 2. Supprimer les policies existantes si nécessaire (optionnel, pour un clean install)
DROP POLICY IF EXISTS path_progress_self ON public.path_progress;
DROP POLICY IF EXISTS path_progress_self_upsert ON public.path_progress;
DROP POLICY IF EXISTS path_progress_admin ON public.path_progress;

-- 3. Créer la policy SELECT pour que les apprenants puissent lire leurs propres parcours
CREATE POLICY path_progress_self ON public.path_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Créer la policy pour UPDATE si nécessaire (mise à jour de la progression)
CREATE POLICY path_progress_self_update ON public.path_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Créer la policy pour INSERT si nécessaire (laisse les formateurs assigner via path_progress_instructor_assign)
-- Note: Les apprenants ne devraient normalement pas insérer eux-mêmes, mais on peut permettre s'ils mettent leur propre user_id
CREATE POLICY path_progress_self_insert ON public.path_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Policy pour les admins (optionnel)
CREATE POLICY path_progress_admin ON public.path_progress
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles pr 
      WHERE pr.id = auth.uid() 
        AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.profiles pr 
      WHERE pr.id = auth.uid() 
        AND pr.role = 'admin'
    )
  );

-- 7. Vérifier les policies après création
SELECT 
  'POLICIES APRES CREATION' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'path_progress'
ORDER BY policyname;

-- 8. Test : Vérifier qu'un apprenant peut maintenant lire ses parcours
-- Remplacez l'email par celui de l'apprenant
SELECT 
  'TEST FINAL' as "Info",
  COUNT(*) as "paths_assignes",
  string_agg(path_id::text, ', ') as "path_ids"
FROM public.path_progress
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
);





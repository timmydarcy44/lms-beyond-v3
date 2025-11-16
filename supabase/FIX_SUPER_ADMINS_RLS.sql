-- Corriger les RLS policies pour super_admins
-- Pour que isSuperAdmin() fonctionne correctement
-- =================================================

-- 1. Vérifier les policies actuelles
SELECT 
  'Current Policies' as "Info",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'super_admins';

-- 2. Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS super_admins_read ON public.super_admins;

-- 3. Créer une policy qui permet à tous les utilisateurs authentifiés
-- de vérifier s'ils sont super admin (mais ne voir que leur propre entrée)
CREATE POLICY super_admins_select_own ON public.super_admins
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. ALTERNATIVE : Utiliser SECURITY DEFINER pour bypass RLS
-- Si la fonction is_super_admin() existe déjà, elle devrait fonctionner
-- Mais on peut aussi créer une policy plus permissive temporairement pour debug

-- 5. Tester : Vérifier si un utilisateur peut se voir lui-même
-- Remplacez 'USER_ID_HERE' par l'ID de timdarcypro@gmail.com
SELECT 
  'Test Query' as "Info",
  sa.user_id,
  sa.is_active,
  auth.uid() as "current_user_id",
  CASE 
    WHEN auth.uid() = sa.user_id THEN 'MATCH - User can see themselves'
    ELSE 'NO MATCH'
  END as "status"
FROM public.super_admins sa
WHERE sa.user_id = auth.uid();




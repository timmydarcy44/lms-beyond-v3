-- Test pour vérifier si le service role client bypass RLS
-- =========================================================

-- 1. Vérifier si RLS est activé sur courses
SELECT 
  'RLS STATUS' as "Info",
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'courses';

-- 2. Vérifier les policies et leurs conditions
SELECT 
  'POLICY DETAILS' as "Info",
  policyname,
  cmd,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY policyname;

-- 3. Test: Vérifier si un utilisateur normal peut voir les courses
-- (Cette requête sera exécutée avec le contexte auth de l'utilisateur)
-- Si vous êtes connecté en tant que super admin, vous devriez voir les courses

-- 4. Vérifier la fonction is_super_admin
SELECT 
  'is_super_admin FUNCTION' as "Info",
  p.proname,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'is_super_admin';





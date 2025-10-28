-- Policies RLS pour le système de sélection d'organisation
-- À exécuter dans Supabase SQL Editor

-- 1. Policy pour org_memberships : permettre à l'utilisateur de lire ses propres membreships
CREATE POLICY IF NOT EXISTS sel_memberships_self
ON org_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Policy pour organizations : permettre de lire les orgs où l'utilisateur est membre
CREATE POLICY IF NOT EXISTS sel_orgs_by_membership
ON organizations
FOR SELECT
TO authenticated
USING (EXISTS(
  SELECT 1 FROM org_memberships m
  WHERE m.org_id = organizations.id AND m.user_id = auth.uid()
));

-- 3. Vérification des policies existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('org_memberships', 'organizations')
ORDER BY tablename, policyname;

-- 4. Test de la requête (à exécuter avec un utilisateur connecté)
-- SELECT 
--   om.user_id,
--   o.id as org_id,
--   o.slug,
--   o.name
-- FROM org_memberships om
-- JOIN organizations o ON om.org_id = o.id
-- WHERE om.user_id = auth.uid();




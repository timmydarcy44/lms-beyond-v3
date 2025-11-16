-- ============================================
-- Script pour corriger les RLS policies pour les formateurs (VERSION 2)
-- ============================================
-- Cette version utilise une approche différente avec des policies plus simples
-- et une fonction PostgreSQL pour contourner les limitations
-- ============================================

-- 1. Supprimer les anciennes policies si elles existent (on va les recréer)
DROP POLICY IF EXISTS org_memberships_instructor_read_learners ON public.org_memberships;
DROP POLICY IF EXISTS org_memberships_instructor_read_org ON public.org_memberships;
DROP POLICY IF EXISTS profiles_instructor_read_learners ON public.profiles;

-- 2. Créer une policy simple qui permet aux formateurs de voir TOUS les membreships dans leurs organisations
CREATE POLICY org_memberships_instructor_read_org ON public.org_memberships
  FOR SELECT
  USING (
    -- Un formateur peut voir tous les membreships dans les organisations où il est instructor
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'instructor'
    )
  );

-- 3. Créer une policy qui permet aux formateurs de lire les profils des membres de leurs organisations
CREATE POLICY profiles_instructor_read_org_members ON public.profiles
  FOR SELECT
  USING (
    -- Un formateur peut lire les profils des utilisateurs qui sont dans ses organisations
    EXISTS (
      SELECT 1 FROM public.org_memberships om_member
      JOIN public.org_memberships om_instructor 
        ON om_member.org_id = om_instructor.org_id
      WHERE om_member.user_id = profiles.id
        AND om_instructor.user_id = auth.uid()
        AND om_instructor.role = 'instructor'
    )
  );

-- 4. Vérification
SELECT 
  'POLICIES CRÉÉES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('org_memberships', 'profiles')
  AND (policyname LIKE '%instructor%' OR policyname LIKE '%org%')
ORDER BY tablename, policyname;




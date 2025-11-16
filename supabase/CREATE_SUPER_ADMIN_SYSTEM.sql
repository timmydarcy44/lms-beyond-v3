-- Script pour créer le système Super Admin
-- Permet un accès complet à toutes les données et fonctionnalités
-- ===============================================================

-- 1. Créer la table super_admins
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON public.super_admins(is_active) WHERE is_active = TRUE;

-- 2. Activer RLS sur super_admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 3. Policy pour super_admins : Seuls les super admins peuvent voir la liste
CREATE POLICY super_admins_read ON public.super_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = TRUE
    )
  );

-- 4. Créer une fonction helper pour vérifier si un utilisateur est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.super_admins
    WHERE user_id = p_user_id
      AND is_active = TRUE
  );
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;

-- 5. Créer des RLS policies pour permettre l'accès super admin à toutes les tables importantes

-- Organizations
DROP POLICY IF EXISTS organizations_super_admin_all ON public.organizations;
CREATE POLICY organizations_super_admin_all ON public.organizations
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Org_memberships
DROP POLICY IF EXISTS org_memberships_super_admin_all ON public.org_memberships;
CREATE POLICY org_memberships_super_admin_all ON public.org_memberships
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Courses
DROP POLICY IF EXISTS courses_super_admin_all ON public.courses;
CREATE POLICY courses_super_admin_all ON public.courses
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Paths
DROP POLICY IF EXISTS paths_super_admin_all ON public.paths;
CREATE POLICY paths_super_admin_all ON public.paths
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Resources
DROP POLICY IF EXISTS resources_super_admin_all ON public.resources;
CREATE POLICY resources_super_admin_all ON public.resources
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Tests
DROP POLICY IF EXISTS tests_super_admin_all ON public.tests;
CREATE POLICY tests_super_admin_all ON public.tests
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Profiles (lecture complète, modification limitée pour sécurité)
DROP POLICY IF EXISTS profiles_super_admin_read ON public.profiles;
CREATE POLICY profiles_super_admin_read ON public.profiles
  FOR SELECT
  USING (public.is_super_admin());

-- Groups
DROP POLICY IF EXISTS groups_super_admin_all ON public.groups;
CREATE POLICY groups_super_admin_all ON public.groups
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Group_members
DROP POLICY IF EXISTS group_members_super_admin_all ON public.group_members;
CREATE POLICY group_members_super_admin_all ON public.group_members
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Enrollments
DROP POLICY IF EXISTS enrollments_super_admin_all ON public.enrollments;
CREATE POLICY enrollments_super_admin_all ON public.enrollments
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Path_progress
DROP POLICY IF EXISTS path_progress_super_admin_all ON public.path_progress;
CREATE POLICY path_progress_super_admin_all ON public.path_progress
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Path_courses, path_tests, path_resources
DROP POLICY IF EXISTS path_courses_super_admin_all ON public.path_courses;
CREATE POLICY path_courses_super_admin_all ON public.path_courses
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS path_tests_super_admin_all ON public.path_tests;
CREATE POLICY path_tests_super_admin_all ON public.path_tests
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS path_resources_super_admin_all ON public.path_resources;
CREATE POLICY path_resources_super_admin_all ON public.path_resources
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 6. Vérifier les policies créées
SELECT 
  'POLICIES SUPER ADMIN CREATED' as "Info",
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE policyname LIKE '%super_admin%'
ORDER BY tablename, policyname;

-- 7. Instructions pour ajouter le premier super admin
-- IMPORTANT : Remplacez 'votre-email@exemple.com' par votre email réel
SELECT 
  'INSTRUCTIONS' as "Info",
  'Remplacez votre-email@exemple.com par votre email et executez :' as "Instruction",
  'INSERT INTO public.super_admins (user_id, created_by, notes)
   SELECT id, id, ''Premier super admin''
   FROM public.profiles 
   WHERE email = ''votre-email@exemple.com'';' as "SQL";





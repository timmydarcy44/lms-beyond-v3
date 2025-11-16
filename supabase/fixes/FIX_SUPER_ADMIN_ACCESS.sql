-- Script pour permettre au Super Admin d'accéder aux organisations et utilisateurs
-- Crée des fonctions SECURITY DEFINER pour bypass RLS

-- 1. Fonction pour récupérer toutes les organisations (bypass RLS)
CREATE OR REPLACE FUNCTION get_all_organizations_for_super_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ,
  member_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.created_at,
    COUNT(om.user_id)::BIGINT as member_count
  FROM organizations o
  LEFT JOIN org_memberships om ON om.org_id = o.id
  GROUP BY o.id, o.name, o.slug, o.created_at
  ORDER BY o.created_at DESC;
END;
$$;

-- 2. Fonction pour récupérer tous les utilisateurs (bypass RLS)
-- Utilise auth.users pour récupérer l'email (nécessite les permissions appropriées)
CREATE OR REPLACE FUNCTION get_all_users_for_super_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  org_ids UUID[],
  org_names TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(au.email::TEXT, '') as email,
    p.full_name,
    COALESCE(
      (SELECT om2.role FROM org_memberships om2 WHERE om2.user_id = p.id LIMIT 1),
      p.role
    ) as role,
    ARRAY_AGG(DISTINCT om.org_id) FILTER (WHERE om.org_id IS NOT NULL) as org_ids,
    ARRAY_AGG(DISTINCT o.name) FILTER (WHERE o.name IS NOT NULL) as org_names
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN org_memberships om ON om.user_id = p.id
  LEFT JOIN organizations o ON o.id = om.org_id
  GROUP BY p.id, au.email, p.full_name, p.role;
END;
$$;

-- 3. Fonction pour récupérer les détails complets d'un utilisateur (bypass RLS)
CREATE OR REPLACE FUNCTION get_user_details_for_super_admin(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  phone TEXT,
  org_ids UUID[],
  org_names TEXT[],
  org_roles TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(au.email::TEXT, p.email, '') as email,
    p.full_name,
    COALESCE(
      (SELECT om2.role FROM org_memberships om2 WHERE om2.user_id = p.id LIMIT 1),
      p.role
    ) as role,
    p.phone,
    ARRAY_AGG(DISTINCT om.org_id) FILTER (WHERE om.org_id IS NOT NULL) as org_ids,
    ARRAY_AGG(DISTINCT o.name) FILTER (WHERE o.name IS NOT NULL) as org_names,
    ARRAY_AGG(DISTINCT om.role) FILTER (WHERE om.role IS NOT NULL) as org_roles
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN org_memberships om ON om.user_id = p.id
  LEFT JOIN organizations o ON o.id = om.org_id
  WHERE p.id = p_user_id
  GROUP BY p.id, au.email, p.email, p.full_name, p.role, p.phone;
END;
$$;

-- 4. Grant permissions pour les fonctions
GRANT EXECUTE ON FUNCTION get_all_organizations_for_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_for_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_details_for_super_admin(UUID) TO authenticated;

-- 5. Vérification: Tester les fonctions
SELECT 'Organizations count:' as test, COUNT(*) FROM get_all_organizations_for_super_admin();
SELECT 'Users count:' as test, COUNT(*) FROM get_all_users_for_super_admin();


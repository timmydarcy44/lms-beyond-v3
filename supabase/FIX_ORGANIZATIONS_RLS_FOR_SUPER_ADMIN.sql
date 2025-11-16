-- ============================================
-- FIX RLS POUR SUPER ADMIN - ORGANIZATIONS
-- ============================================
-- Permet aux Super Admins d'accéder à toutes les organisations
-- même sans service role key

-- 1. Vérifier les politiques existantes
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
WHERE tablename = 'organizations'
ORDER BY policyname;

-- 2. Créer une fonction SECURITY DEFINER pour bypass RLS
CREATE OR REPLACE FUNCTION public.get_organization_for_super_admin(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si l'utilisateur est un super admin
  IF NOT EXISTS (
    SELECT 1 
    FROM public.super_admins 
    WHERE user_id = auth.uid() 
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied: Not a super admin';
  END IF;

  -- Retourner l'organisation
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.logo,
    o.created_at
  FROM public.organizations o
  WHERE o.id = p_org_id;
END;
$$;

-- 3. Grant EXECUTE à authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_for_super_admin(UUID) TO authenticated;

-- 4. Créer une politique RLS plus permissive pour organizations (si nécessaire)
DROP POLICY IF EXISTS organizations_super_admin_read ON public.organizations;
CREATE POLICY organizations_super_admin_read
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.super_admins 
    WHERE user_id = auth.uid() 
    AND is_active = TRUE
  )
);

-- 5. Test de la fonction
-- SELECT * FROM public.get_organization_for_super_admin('votre-org-id-ici');

-- 6. Vérification finale
SELECT 
  'RLS Policies for organizations:' as info,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'organizations';





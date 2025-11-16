-- Fix RLS policies for catalog_items to allow Super Admin to insert
-- Drop existing policies
DROP POLICY IF EXISTS "catalog_items_insert_super_admin" ON catalog_items;
DROP POLICY IF EXISTS "catalog_items_update_super_admin" ON catalog_items;
DROP POLICY IF EXISTS "catalog_items_select_active" ON catalog_items;
DROP POLICY IF EXISTS "catalog_items_delete_super_admin" ON catalog_items;

-- Supprimer toutes les versions existantes de is_super_admin() avec toutes les signatures possibles
-- En spécifiant explicitement les signatures pour éviter les ambiguïtés
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Trouver et supprimer toutes les fonctions is_super_admin
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as func_name,
            pg_get_function_identity_arguments(p.oid) as func_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'is_super_admin'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
            func_record.schema_name, 
            func_record.func_name, 
            func_record.func_args);
    END LOOP;
END $$;

-- Recréer la fonction is_super_admin avec la signature correcte
CREATE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  );
END;
$$;

-- INSERT policy: Only Super Admins can insert
CREATE POLICY "catalog_items_insert_super_admin"
  ON catalog_items
  FOR INSERT
  WITH CHECK (is_super_admin());

-- UPDATE policy: Only Super Admins can update
CREATE POLICY "catalog_items_update_super_admin"
  ON catalog_items
  FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- SELECT policy: Everyone can read active items, Super Admins can read all
CREATE POLICY "catalog_items_select_active"
  ON catalog_items
  FOR SELECT
  USING (is_active = true OR is_super_admin());

-- DELETE policy: Only Super Admins can delete
CREATE POLICY "catalog_items_delete_super_admin"
  ON catalog_items
  FOR DELETE
  USING (is_super_admin());

-- Comment
COMMENT ON FUNCTION public.is_super_admin() IS 'Check if current user is a super admin';

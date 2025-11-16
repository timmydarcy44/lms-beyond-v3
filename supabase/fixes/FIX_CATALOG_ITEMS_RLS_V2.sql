-- Fix RLS policies for catalog_items - Version 2 avec fonction SECURITY DEFINER pour insertion
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "catalog_items_insert_super_admin" ON catalog_items;
DROP POLICY IF EXISTS "catalog_items_update_super_admin" ON catalog_items;
DROP POLICY IF EXISTS "catalog_items_select_active" ON catalog_items;
DROP POLICY IF EXISTS "catalog_items_delete_super_admin" ON catalog_items;

-- Vérifier et supprimer toutes les versions de is_super_admin
DO $$
DECLARE
    func_record RECORD;
BEGIN
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

-- Recréer la fonction is_super_admin
CREATE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = current_user_id
        AND profiles.role = 'super_admin'
    );
END;
$$;

-- Fonction SECURITY DEFINER pour insérer un item du catalogue
-- Cette fonction bypass complètement RLS
CREATE OR REPLACE FUNCTION public.insert_catalog_item(
    p_item_type text,
    p_content_id uuid,
    p_title text,
    p_description text DEFAULT NULL,
    p_short_description text DEFAULT NULL,
    p_hero_image_url text DEFAULT NULL,
    p_thumbnail_url text DEFAULT NULL,
    p_price numeric DEFAULT 0,
    p_is_free boolean DEFAULT false,
    p_category text DEFAULT NULL,
    p_duration text DEFAULT NULL,
    p_level text DEFAULT NULL,
    p_target_audience text DEFAULT 'pro',
    p_is_featured boolean DEFAULT false,
    p_created_by uuid DEFAULT auth.uid()
)
RETURNS SETOF catalog_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Vérifier que l'utilisateur est Super Admin
    -- Utiliser p_created_by si fourni, sinon auth.uid()
    IF p_created_by IS NOT NULL THEN
        current_user_id := p_created_by;
    ELSE
        current_user_id := auth.uid();
    END IF;
    
    -- Si toujours null, essayer les claims JWT
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'User not authenticated';
        END;
    END IF;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Vérifier que l'utilisateur est Super Admin
    -- Utiliser COALESCE pour s'assurer qu'on vérifie bien le bon utilisateur
    PERFORM 1 FROM public.profiles
    WHERE profiles.id = current_user_id
    AND profiles.role = 'super_admin';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only super admins can insert catalog items. User ID: %, Role: %', 
            current_user_id,
            (SELECT role FROM public.profiles WHERE id = current_user_id);
    END IF;
    
    -- Insérer l'item et retourner l'objet complet
    RETURN QUERY
    INSERT INTO catalog_items (
        item_type,
        content_id,
        title,
        description,
        short_description,
        hero_image_url,
        thumbnail_url,
        price,
        is_free,
        category,
        duration,
        level,
        target_audience,
        is_featured,
        created_by
    ) VALUES (
        p_item_type,
        p_content_id,
        p_title,
        p_description,
        p_short_description,
        p_hero_image_url,
        p_thumbnail_url,
        p_price,
        p_is_free,
        p_category,
        p_duration,
        p_level,
        p_target_audience::text,
        p_is_featured,
        current_user_id
    ) RETURNING *;
END;
$$;

-- INSERT policy: Utiliser la fonction SECURITY DEFINER
-- On garde aussi la policy normale au cas où
CREATE POLICY "catalog_items_insert_super_admin"
  ON catalog_items
  FOR INSERT
  WITH CHECK (public.is_super_admin());

-- UPDATE policy: Only Super Admins can update
CREATE POLICY "catalog_items_update_super_admin"
  ON catalog_items
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- SELECT policy: Everyone can read active items, Super Admins can read all
CREATE POLICY "catalog_items_select_active"
  ON catalog_items
  FOR SELECT
  USING (is_active = true OR public.is_super_admin());

-- DELETE policy: Only Super Admins can delete
CREATE POLICY "catalog_items_delete_super_admin"
  ON catalog_items
  FOR DELETE
  USING (public.is_super_admin());

-- Comment
COMMENT ON FUNCTION public.is_super_admin() IS 'Check if current user is a super admin. Returns false if no authenticated user.';
COMMENT ON FUNCTION public.insert_catalog_item IS 'Insert a catalog item (Super Admin only). Bypasses RLS using SECURITY DEFINER.';

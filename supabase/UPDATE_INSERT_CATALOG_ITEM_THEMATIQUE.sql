-- Mettre à jour la fonction insert_catalog_item pour inclure le paramètre thematique
-- Cette fonction est utilisée pour insérer des items dans le catalogue en bypassant RLS

DROP FUNCTION IF EXISTS public.insert_catalog_item(text, uuid, text, text, text, text, text, numeric, boolean, text, text, text, text, boolean, uuid);

-- Recréer la fonction avec le paramètre thematique
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
    p_thematique text DEFAULT NULL,
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
        thematique,
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
        p_thematique,
        p_duration,
        p_level,
        p_target_audience::text,
        p_is_featured,
        current_user_id
    ) RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.insert_catalog_item IS 'Insert a catalog item (Super Admin only). Bypasses RLS using SECURITY DEFINER. Includes thematique parameter.';




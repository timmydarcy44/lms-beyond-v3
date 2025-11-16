-- Corriger l'assignation automatique de creator_id lors de la création
-- ====================================================================

-- 1. Supprimer toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS public.insert_catalog_item(text, uuid, text, text, text, text, text, numeric, boolean, text, text, text, text, text, boolean, uuid);
DROP FUNCTION IF EXISTS public.insert_catalog_item(text, uuid, text, text, text, text, text, numeric, boolean, text, text, text, text, boolean, uuid);

-- 2. Mettre à jour la fonction insert_catalog_item pour assigner creator_id
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
    user_role text;
    user_email text;
BEGIN
    -- Vérifier que l'utilisateur est Super Admin
    IF p_created_by IS NOT NULL THEN
        current_user_id := p_created_by;
    ELSE
        current_user_id := auth.uid();
    END IF;
    
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
    
    -- Récupérer le rôle et l'email de l'utilisateur
    SELECT role, email INTO user_role, user_email
    FROM public.profiles
    WHERE id = current_user_id;
    
    IF user_role IS NULL THEN
        RAISE EXCEPTION 'User not found in profiles. User ID: %', current_user_id;
    END IF;
    
    -- Vérifier que l'utilisateur est dans la table super_admins (plus fiable que profiles.role)
    IF NOT EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE user_id = current_user_id
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Only super admins can insert catalog items. User ID: %, Email: %, Current Role: %, Not in super_admins table', 
            current_user_id, 
            COALESCE(user_email, 'unknown'),
            user_role;
    END IF;
    
    -- Insérer l'item avec creator_id = created_by
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
        created_by,
        creator_id  -- IMPORTANT: Assigner creator_id = created_by
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
        current_user_id,
        current_user_id  -- creator_id = created_by (Super Admin)
    ) RETURNING *;
END;
$$;

-- 2. Mettre à jour les items existants qui n'ont pas de creator_id
UPDATE catalog_items ci
SET creator_id = ci.created_by
WHERE ci.creator_id IS NULL
  AND ci.created_by IS NOT NULL;

-- 3. Créer un trigger pour assigner automatiquement creator_id à l'insertion
CREATE OR REPLACE FUNCTION assign_catalog_item_creator_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si creator_id n'est pas défini, utiliser created_by
  IF NEW.creator_id IS NULL AND NEW.created_by IS NOT NULL THEN
    NEW.creator_id := NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_catalog_item_creator_id ON catalog_items;
CREATE TRIGGER trigger_assign_catalog_item_creator_id
  BEFORE INSERT ON catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION assign_catalog_item_creator_id();

-- 4. Vérifier les résultats
SELECT 
  'CATALOG ITEMS AVEC CREATOR_ID' as "Info",
  COUNT(*) FILTER (WHERE creator_id IS NOT NULL) as avec_creator_id,
  COUNT(*) FILTER (WHERE creator_id IS NULL) as sans_creator_id,
  COUNT(*) as total
FROM catalog_items;


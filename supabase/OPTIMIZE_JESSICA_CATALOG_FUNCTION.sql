-- =====================================================
-- Fonction SQL optimisée pour récupérer les items
-- du catalogue Jessica Contentin en une seule requête
-- =====================================================
-- Cette fonction remplace les 60-80 requêtes multiples
-- par une seule requête avec jointures
-- =====================================================

CREATE OR REPLACE FUNCTION get_jessica_catalog_items(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  content_id UUID,
  title TEXT,
  description TEXT,
  short_description TEXT,
  hero_image_url TEXT,
  thumbnail_url TEXT,
  price NUMERIC,
  is_free BOOLEAN,
  category TEXT,
  access_status TEXT,
  stripe_checkout_url TEXT,
  target_audience TEXT,
  created_at TIMESTAMPTZ,
  slug TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_org_id UUID;
BEGIN
  -- Récupérer l'org_id de l'utilisateur via org_memberships si fourni
  IF user_id_param IS NOT NULL THEN
    SELECT org_id INTO user_org_id
    FROM org_memberships
    WHERE user_id = user_id_param
    LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT 
    ci.id,
    ci.item_type,
    ci.content_id,
    COALESCE(ci.title, r.title, c.title, t.title) as title,
    COALESCE(ci.description, r.description, c.description, t.description) as description,
    ci.short_description,
    COALESCE(
      ci.hero_image_url, 
      r.cover_url,
      r.thumbnail_url,
      c.hero_image_url, 
      c.thumbnail_url,
      c.cover_image,
      t.hero_image_url, 
      t.thumbnail_url,
      t.cover_image
    ) as hero_image_url,
    COALESCE(
      ci.thumbnail_url,
      r.thumbnail_url,
      r.cover_url,
      c.thumbnail_url,
      c.hero_image_url,
      c.cover_image,
      t.thumbnail_url,
      t.hero_image_url,
      t.cover_image
    ) as thumbnail_url,
    COALESCE(ci.price, r.price, c.price, t.price, 0)::NUMERIC as price,
    COALESCE(
      ci.is_free, 
      (COALESCE(ci.price, r.price, c.price, t.price, 0) = 0)
    ) as is_free,
    COALESCE(ci.category, c.category, t.category) as category, -- Note: resources n'a pas de colonne category
    CASE 
      -- Vérifier l'accès utilisateur
      WHEN user_id_param IS NOT NULL AND EXISTS (
        SELECT 1 
        FROM catalog_access ca 
        WHERE ca.catalog_item_id = ci.id 
          AND (
            ca.user_id = user_id_param 
            OR (user_org_id IS NOT NULL AND ca.organization_id = user_org_id)
          )
          AND ca.access_status IN ('purchased', 'manually_granted', 'free')
        LIMIT 1
      ) THEN 'purchased'
      -- Vérifier si c'est gratuit
      WHEN COALESCE(
        ci.is_free, 
        (COALESCE(ci.price, r.price, c.price, t.price, 0) = 0)
      ) THEN 'free'
      -- Sinon, accès payant requis
      ELSE 'pending_payment'
    END as access_status,
    ci.stripe_checkout_url,
    ci.target_audience,
    ci.created_at,
    COALESCE(ci.slug, r.slug, c.slug, t.slug) as slug
  FROM catalog_items ci
  -- Jointures LEFT pour récupérer les données selon le type
  LEFT JOIN resources r ON ci.item_type = 'ressource' AND ci.content_id = r.id
  LEFT JOIN courses c ON ci.item_type = 'module' AND ci.content_id = c.id
  LEFT JOIN tests t ON ci.item_type = 'test' AND ci.content_id = t.id
  WHERE ci.created_by = '17364229-fe78-4986-ac69-41b880e34631' -- Jessica Contentin UUID (utilise created_by qui existe toujours)
    AND ci.is_active = true
  ORDER BY ci.created_at DESC;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_jessica_catalog_items IS 
'Récupère tous les items du catalogue Jessica Contentin en une seule requête optimisée avec jointures. Remplace les multiples requêtes N+1 par une seule requête efficace.';

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_jessica_catalog_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_jessica_catalog_items TO anon;


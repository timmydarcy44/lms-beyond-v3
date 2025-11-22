-- Corriger les formations manquantes dans le catalogue
-- =========================================================================

DO $$
DECLARE
  super_admin_id UUID;
  courses_created INTEGER := 0;
  courses_updated INTEGER := 0;
BEGIN
  -- Récupérer l'ID du Super Admin actif
  SELECT user_id INTO super_admin_id
  FROM super_admins
  WHERE is_active = true
  LIMIT 1;
  
  IF super_admin_id IS NULL THEN
    RAISE EXCEPTION 'Aucun Super Admin actif trouvé';
  END IF;
  
  RAISE NOTICE 'Super Admin ID: %', super_admin_id;
  
  -- 1. Créer les catalog_items manquants pour TOUTES les formations du Super Admin
  -- Priorité : assignment_type = 'no_school' OU target_audience = 'apprenant' OU status = 'published'
  INSERT INTO catalog_items (
    content_id,
    item_type,
    title,
    description,
    short_description,
    price,
    is_free,
    category,
    hero_image_url,
    thumbnail_url,
    target_audience,
    creator_id,
    created_by,
    is_active,
    created_at,
    updated_at
  )
  SELECT 
    c.id,
    'module',
    c.title,
    c.description,
    COALESCE(LEFT(c.description, 150), ''),
    COALESCE((c.builder_snapshot->'general'->>'price')::numeric, 0),
    COALESCE((c.builder_snapshot->'general'->>'price')::numeric, 0) = 0,
    c.builder_snapshot->'general'->>'category',
    COALESCE(c.cover_image, c.builder_snapshot->'general'->>'heroImage'),
    COALESCE(c.cover_image, c.builder_snapshot->'general'->>'heroImage'),
    CASE 
      WHEN c.builder_snapshot->'general'->>'assignment_type' = 'no_school' THEN 'apprenant'
      WHEN c.builder_snapshot->'general'->>'target_audience' = 'apprenant' THEN 'apprenant'
      WHEN c.builder_snapshot->'general'->>'target_audience' IS NOT NULL THEN c.builder_snapshot->'general'->>'target_audience'
      WHEN c.status = 'published' THEN 'apprenant' -- Par défaut pour les formations publiées
      ELSE 'all'
    END,
    c.creator_id,
    c.creator_id, -- created_by = creator_id
    CASE 
      WHEN c.builder_snapshot->'general'->>'assignment_type' = 'no_school' THEN true
      WHEN c.builder_snapshot->'general'->>'target_audience' = 'apprenant' THEN true
      WHEN c.status = 'published' THEN true -- Activer les formations publiées
      ELSE false
    END,
    c.created_at,
    c.updated_at
  FROM courses c
  WHERE c.creator_id = super_admin_id
    AND NOT EXISTS (
      SELECT 1 FROM catalog_items ci 
      WHERE ci.content_id = c.id 
      AND ci.item_type = 'module'
    )
    AND (
      c.builder_snapshot->'general'->>'assignment_type' = 'no_school'
      OR c.builder_snapshot->'general'->>'target_audience' = 'apprenant'
      OR c.status = 'published' -- Inclure toutes les formations publiées
    )
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS courses_created = ROW_COUNT;
  RAISE NOTICE 'Catalog items créés: %', courses_created;
  
  -- 2. Mettre à jour les catalog_items existants pour les formations publiées ou "apprenant"
  UPDATE catalog_items ci
  SET 
    is_active = CASE 
      WHEN c.builder_snapshot->'general'->>'assignment_type' = 'no_school' THEN true
      WHEN c.builder_snapshot->'general'->>'target_audience' = 'apprenant' THEN true
      WHEN c.status = 'published' THEN true
      ELSE ci.is_active
    END,
    target_audience = CASE 
      WHEN c.builder_snapshot->'general'->>'assignment_type' = 'no_school' THEN 'apprenant'
      WHEN c.builder_snapshot->'general'->>'target_audience' = 'apprenant' THEN 'apprenant'
      WHEN c.builder_snapshot->'general'->>'target_audience' IS NOT NULL THEN c.builder_snapshot->'general'->>'target_audience'
      WHEN c.status = 'published' THEN 'apprenant'
      ELSE ci.target_audience
    END,
    title = c.title,
    description = c.description,
    short_description = COALESCE(LEFT(c.description, 150), ci.short_description),
    price = COALESCE((c.builder_snapshot->'general'->>'price')::numeric, ci.price),
    is_free = COALESCE((c.builder_snapshot->'general'->>'price')::numeric, ci.price) = 0,
    category = COALESCE(c.builder_snapshot->'general'->>'category', ci.category),
    hero_image_url = COALESCE(c.cover_image, c.builder_snapshot->'general'->>'heroImage', ci.hero_image_url),
    thumbnail_url = COALESCE(c.cover_image, c.builder_snapshot->'general'->>'heroImage', ci.thumbnail_url),
    updated_at = NOW()
  FROM courses c
  WHERE ci.content_id = c.id
    AND ci.item_type = 'module'
    AND ci.creator_id = super_admin_id
    AND (
      c.builder_snapshot->'general'->>'assignment_type' = 'no_school'
      OR c.builder_snapshot->'general'->>'target_audience' = 'apprenant'
      OR c.status = 'published'
    )
    AND (
      ci.is_active = false 
      OR ci.target_audience != 'apprenant'
      OR ci.title != c.title
    );
  
  GET DIAGNOSTICS courses_updated = ROW_COUNT;
  RAISE NOTICE 'Catalog items mis à jour: %', courses_updated;
  
  -- 3. Résumé final
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Résumé de la correction';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Catalog items créés: %', courses_created;
  RAISE NOTICE 'Catalog items mis à jour: %', courses_updated;
  RAISE NOTICE '========================================';
  
  -- 4. Afficher le nombre total de catalog_items actifs pour apprenants
  SELECT COUNT(*) INTO courses_created
  FROM catalog_items
  WHERE creator_id = super_admin_id
    AND item_type = 'module'
    AND is_active = true
    AND target_audience = 'apprenant';
  
  RAISE NOTICE 'Total catalog items actifs pour apprenants: %', courses_created;
  
END $$;


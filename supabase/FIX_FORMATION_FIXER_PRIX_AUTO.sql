-- Script automatique pour corriger la formation "fixer ses prix"
-- Exécutez ce script dans Supabase Studio → SQL Editor

DO $$
DECLARE
  v_course_id UUID;
  v_catalog_item_id UUID;
  v_title TEXT;
  v_category TEXT;
  v_assignment_type TEXT;
  v_subtitle TEXT;
  v_price NUMERIC;
  v_hero_image TEXT;
BEGIN
  -- 1. Trouver la formation "fixer ses prix" de Tim
  SELECT 
    c.id,
    COALESCE(c.builder_snapshot->'general'->>'title', c.title),
    COALESCE(c.builder_snapshot->'general'->>'category', 'business'),
    c.builder_snapshot->'general'->>'assignment_type',
    c.builder_snapshot->'general'->>'subtitle',
    COALESCE((c.builder_snapshot->'general'->>'price')::numeric, 0),
    c.builder_snapshot->'general'->>'heroImage'
  INTO 
    v_course_id,
    v_title,
    v_category,
    v_assignment_type,
    v_subtitle,
    v_price,
    v_hero_image
  FROM courses c
  WHERE c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
    AND (
      c.title ILIKE '%fixer%prix%'
      OR c.title ILIKE '%prix%'
      OR c.builder_snapshot->'general'->>'title' ILIKE '%fixer%prix%'
      OR c.builder_snapshot->'general'->>'title' ILIKE '%prix%'
    )
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE '❌ Formation "fixer ses prix" non trouvée pour Tim';
    RAISE NOTICE 'Vérifiez que la formation existe et a été créée par timdarcypro@gmail.com';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Formation trouvée: % (ID: %)', v_title, v_course_id;
  RAISE NOTICE '   Category: %, Assignment type: %', v_category, v_assignment_type;

  -- 2. Vérifier si un catalog_item existe
  SELECT id INTO v_catalog_item_id
  FROM catalog_items
  WHERE content_id = v_course_id
    AND item_type = 'module';

  -- 3. Créer ou mettre à jour le catalog_item
  IF v_catalog_item_id IS NULL THEN
    -- Créer le catalog_item
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
    ) VALUES (
      v_course_id,
      'module',
      v_title,
      v_subtitle,
      COALESCE(LEFT(v_subtitle, 150), ''),
      v_price,
      (v_price = 0),
      v_category,
      v_hero_image,
      v_hero_image,
      'apprenant', -- Forcer à "apprenant" pour Beyond No School
      '60c88469-3c53-417f-a81d-565a662ad2f5', -- Tim (creator_id - peut être NULL)
      '60c88469-3c53-417f-a81d-565a662ad2f5', -- Tim (created_by - NOT NULL)
      true, -- Actif
      NOW(),
      NOW()
    )
    RETURNING id INTO v_catalog_item_id;

    RAISE NOTICE '✅ Catalog item créé avec ID: %', v_catalog_item_id;
  ELSE
    -- Mettre à jour le catalog_item existant
    UPDATE catalog_items
    SET
      title = v_title,
      description = v_subtitle,
      short_description = COALESCE(LEFT(v_subtitle, 150), ''),
      price = v_price,
      is_free = (v_price = 0),
      category = v_category,
      hero_image_url = COALESCE(v_hero_image, hero_image_url),
      thumbnail_url = COALESCE(v_hero_image, thumbnail_url),
      target_audience = 'apprenant', -- Forcer à "apprenant" pour Beyond No School
      is_active = true, -- Forcer à actif
      updated_at = NOW()
    WHERE id = v_catalog_item_id;

    RAISE NOTICE '✅ Catalog item mis à jour (ID: %)', v_catalog_item_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Formation "fixer ses prix" est maintenant dans le catalogue Beyond No School';
  RAISE NOTICE '   - Title: %', v_title;
  RAISE NOTICE '   - Category: %', v_category;
  RAISE NOTICE '   - Target audience: apprenant';
  RAISE NOTICE '   - Is active: true';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Si la formation n''apparaît toujours pas, vérifiez que:';
  RAISE NOTICE '   1. Le cache du navigateur est vidé (Ctrl+Shift+R)';
  RAISE NOTICE '   2. La formation a bien assignment_type = "no_school" dans son snapshot';

END $$;

-- Vérification finale
SELECT 
  ci.id,
  ci.title,
  ci.category,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  c.title as course_title,
  c.status as course_status,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
WHERE ci.item_type = 'module'
  AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
  AND (ci.title ILIKE '%fixer%prix%' OR ci.title ILIKE '%prix%' OR c.title ILIKE '%fixer%prix%' OR c.title ILIKE '%prix%')
ORDER BY ci.created_at DESC;


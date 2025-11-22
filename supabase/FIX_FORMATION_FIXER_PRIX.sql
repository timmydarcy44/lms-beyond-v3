-- Script pour vérifier et corriger la formation "fixer ses prix"
-- 1. Trouver la formation
-- 2. Vérifier si elle a un catalog_item
-- 3. Créer/mettre à jour le catalog_item si nécessaire

-- Étape 1: Trouver la formation
DO $$
DECLARE
  v_course_id UUID;
  v_creator_id UUID;
  v_title TEXT;
  v_category TEXT;
  v_assignment_type TEXT;
  v_target_audience TEXT;
  v_price NUMERIC;
  v_hero_image TEXT;
  v_subtitle TEXT;
  v_catalog_item_id UUID;
BEGIN
  -- Chercher la formation "fixer ses prix" créée par Tim
  SELECT 
    c.id,
    c.creator_id,
    c.builder_snapshot->'general'->>'title',
    c.builder_snapshot->'general'->>'category',
    c.builder_snapshot->'general'->>'assignment_type',
    c.builder_snapshot->'general'->>'target_audience',
    COALESCE((c.builder_snapshot->'general'->>'price')::numeric, 0),
    c.builder_snapshot->'general'->>'heroImage',
    c.builder_snapshot->'general'->>'subtitle'
  INTO 
    v_course_id,
    v_creator_id,
    v_title,
    v_category,
    v_assignment_type,
    v_target_audience,
    v_price,
    v_hero_image,
    v_subtitle
  FROM courses c
  WHERE c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
    AND (
      c.builder_snapshot->'general'->>'title' ILIKE '%fixer%prix%'
      OR c.builder_snapshot->'general'->>'title' ILIKE '%prix%'
      OR c.title ILIKE '%fixer%prix%'
      OR c.title ILIKE '%prix%'
    )
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'Formation "fixer ses prix" non trouvée pour Tim';
    RETURN;
  END IF;

  RAISE NOTICE 'Formation trouvée: % (ID: %)', v_title, v_course_id;
  RAISE NOTICE 'Category: %, Assignment type: %, Target audience: %', v_category, v_assignment_type, v_target_audience;

  -- Étape 2: Vérifier si un catalog_item existe
  SELECT id INTO v_catalog_item_id
  FROM catalog_items
  WHERE content_id = v_course_id
    AND item_type = 'module';

  -- Étape 3: Déterminer les valeurs pour le catalog_item
  -- Pour Beyond No School, assignment_type doit être "no_school" et target_audience "apprenant"
  IF v_assignment_type IS NULL OR v_assignment_type != 'no_school' THEN
    RAISE NOTICE 'ATTENTION: assignment_type n''est pas "no_school" (valeur actuelle: %)', v_assignment_type;
    RAISE NOTICE 'Il faudra mettre à jour le builder_snapshot de la formation pour que assignment_type = "no_school"';
  END IF;

  IF v_target_audience IS NULL OR v_target_audience != 'apprenant' THEN
    RAISE NOTICE 'ATTENTION: target_audience n''est pas "apprenant" (valeur actuelle: %)', v_target_audience;
  END IF;

  -- Forcer target_audience à "apprenant" pour Beyond No School
  v_target_audience := 'apprenant';

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
      COALESCE(v_category, 'business'),
      v_hero_image,
      v_hero_image,
      v_target_audience,
      v_creator_id,
      true, -- Actif pour Beyond No School
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
      category = COALESCE(v_category, 'business'),
      hero_image_url = COALESCE(v_hero_image, hero_image_url),
      thumbnail_url = COALESCE(v_hero_image, thumbnail_url),
      target_audience = v_target_audience,
      is_active = true, -- Forcer à actif pour Beyond No School
      updated_at = NOW()
    WHERE id = v_catalog_item_id;

    RAISE NOTICE '✅ Catalog item mis à jour (ID: %)', v_catalog_item_id;
  END IF;

  RAISE NOTICE '✅ Formation "fixer ses prix" est maintenant dans le catalogue Beyond No School';
  RAISE NOTICE '   - Category: %', COALESCE(v_category, 'business');
  RAISE NOTICE '   - Target audience: %', v_target_audience;
  RAISE NOTICE '   - Is active: true';
  RAISE NOTICE '   - Creator ID: %', v_creator_id;

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


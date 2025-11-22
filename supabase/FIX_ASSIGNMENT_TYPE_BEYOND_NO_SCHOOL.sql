-- Script pour corriger assignment_type = null dans les formations Beyond No School
-- Met à jour le builder_snapshot pour définir assignment_type = "no_school"
-- et s'assure que les catalog_items sont corrects

DO $$
DECLARE
  v_tim_user_id UUID := '60c88469-3c53-417f-a81d-565a662ad2f5';
  v_course RECORD;
  v_snapshot JSONB;
  v_updated_snapshot JSONB;
  v_courses_updated INTEGER := 0;
  v_catalog_items_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '🔧 Correction des assignment_type pour Beyond No School...';
  RAISE NOTICE '================================================';
  
  -- Parcourir toutes les formations créées par Tim qui ont assignment_type = null
  FOR v_course IN
    SELECT 
      c.id,
      c.title,
      c.builder_snapshot,
      c.status
    FROM courses c
    WHERE (c.creator_id = v_tim_user_id OR c.owner_id = v_tim_user_id)
      AND c.builder_snapshot IS NOT NULL
      AND (
        c.builder_snapshot->'general'->>'assignment_type' IS NULL
        OR c.builder_snapshot->'general'->>'assignment_type' = 'null'
      )
    ORDER BY c.created_at DESC
  LOOP
    v_snapshot := v_course.builder_snapshot;
    
    -- Mettre à jour le snapshot pour ajouter assignment_type = "no_school"
    v_updated_snapshot := jsonb_set(
      v_snapshot,
      '{general,assignment_type}',
      '"no_school"',
      true
    );
    
    -- S'assurer aussi que target_audience = "apprenant"
    IF COALESCE(v_snapshot->'general'->>'target_audience', 'apprenant') != 'apprenant' THEN
      v_updated_snapshot := jsonb_set(
        v_updated_snapshot,
        '{general,target_audience}',
        '"apprenant"',
        true
      );
    END IF;
    
    -- Mettre à jour le course
    UPDATE courses
    SET 
      builder_snapshot = v_updated_snapshot,
      updated_at = NOW()
    WHERE id = v_course.id;
    
    RAISE NOTICE '✅ Formation mise à jour: % (ID: %)', v_course.title, v_course.id;
    v_courses_updated := v_courses_updated + 1;
    
    -- Vérifier et mettre à jour le catalog_item correspondant
    DECLARE
      v_catalog_item_id UUID;
      v_catalog_item_exists BOOLEAN;
    BEGIN
      SELECT id INTO v_catalog_item_id
      FROM catalog_items
      WHERE content_id = v_course.id
        AND item_type = 'module'
        AND creator_id = v_tim_user_id
      LIMIT 1;
      
      IF v_catalog_item_id IS NOT NULL THEN
        -- Mettre à jour le catalog_item pour s'assurer qu'il est actif et a le bon target_audience
        UPDATE catalog_items
        SET
          is_active = true,
          target_audience = 'apprenant',
          updated_at = NOW()
        WHERE id = v_catalog_item_id
          AND (is_active != true OR target_audience != 'apprenant');
        
        IF FOUND THEN
          RAISE NOTICE '   ✅ Catalog item mis à jour (ID: %)', v_catalog_item_id;
          v_catalog_items_updated := v_catalog_items_updated + 1;
        END IF;
      ELSE
        -- Créer le catalog_item s'il n'existe pas
        DECLARE
          v_title TEXT;
          v_subtitle TEXT;
          v_price NUMERIC;
          v_category TEXT;
          v_hero_image TEXT;
        BEGIN
          v_title := COALESCE(v_updated_snapshot->'general'->>'title', v_course.title);
          v_subtitle := COALESCE(v_updated_snapshot->'general'->>'subtitle', '');
          v_price := COALESCE((v_updated_snapshot->'general'->>'price')::numeric, 0);
          v_category := COALESCE(v_updated_snapshot->'general'->>'category', 'business');
          v_hero_image := COALESCE(v_updated_snapshot->'general'->>'heroImage', NULL);
          
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
            v_course.id,
            'module',
            v_title,
            v_subtitle,
            COALESCE(LEFT(v_subtitle, 150), ''),
            v_price,
            (v_price = 0),
            v_category,
            v_hero_image,
            v_hero_image,
            'apprenant',
            v_tim_user_id,
            v_tim_user_id,
            true,
            NOW(),
            NOW()
          ) RETURNING id INTO v_catalog_item_id;
          
          RAISE NOTICE '   ✅ Catalog item créé (ID: %)', v_catalog_item_id;
          v_catalog_items_updated := v_catalog_items_updated + 1;
        END;
      END IF;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   Formations mises à jour: %', v_courses_updated;
  RAISE NOTICE '   Catalog items mis à jour/créés: %', v_catalog_items_updated;
  RAISE NOTICE '================================================';
END $$;

-- Vérification finale : lister toutes les formations Beyond No School avec leurs catalog_items
SELECT 
  c.id as course_id,
  c.title as course_title,
  c.status as course_status,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as target_audience,
  ci.id as catalog_item_id,
  ci.is_active as catalog_is_active,
  ci.target_audience as catalog_target_audience,
  CASE 
    WHEN ci.id IS NULL THEN '❌ Pas de catalog_item'
    WHEN ci.is_active = false THEN '⚠️  Catalog item inactif'
    WHEN ci.target_audience != 'apprenant' THEN '⚠️  Mauvais target_audience'
    ELSE '✅ OK'
  END as status
FROM courses c
LEFT JOIN catalog_items ci ON ci.content_id = c.id 
  AND ci.item_type = 'module' 
  AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5'
WHERE (c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' 
   OR c.owner_id = '60c88469-3c53-417f-a81d-565a662ad2f5')
  AND c.status = 'published'
ORDER BY c.created_at DESC;


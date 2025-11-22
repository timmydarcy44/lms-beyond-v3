-- Diagnostic et correction des formations Beyond No School non affichées dans le catalogue
-- Ce script vérifie les formations créées par Tim (Beyond No School) et s'assure qu'elles ont un catalog_item correct

DO $$
DECLARE
  v_tim_user_id UUID := '60c88469-3c53-417f-a81d-565a662ad2f5';
  v_course RECORD;
  v_catalog_item_id UUID;
  v_assignment_type TEXT;
  v_target_audience TEXT;
  v_title TEXT;
  v_subtitle TEXT;
  v_price NUMERIC;
  v_category TEXT;
  v_hero_image TEXT;
  v_status TEXT;
  v_snapshot JSONB;
  v_should_be_active BOOLEAN;
  v_courses_fixed INTEGER := 0;
  v_courses_checked INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Diagnostic des formations Beyond No School...';
  RAISE NOTICE '================================================';
  
  -- Parcourir toutes les formations créées par Tim
  FOR v_course IN
    SELECT 
      c.id,
      c.title,
      c.description,
      c.status,
      c.builder_snapshot,
      c.cover_image,
      c.price,
      c.category,
      c.created_at,
      c.updated_at
    FROM courses c
    WHERE c.creator_id = v_tim_user_id
      OR c.owner_id = v_tim_user_id
    ORDER BY c.created_at DESC
  LOOP
    v_courses_checked := v_courses_checked + 1;
    
    -- Extraire les valeurs du snapshot
    v_snapshot := v_course.builder_snapshot;
    v_assignment_type := COALESCE(v_snapshot->'general'->>'assignment_type', 'no_school');
    v_target_audience := COALESCE(v_snapshot->'general'->>'target_audience', 'apprenant');
    v_title := COALESCE(v_snapshot->'general'->>'title', v_course.title);
    v_subtitle := COALESCE(v_snapshot->'general'->>'subtitle', v_course.description);
    v_price := COALESCE((v_snapshot->'general'->>'price')::numeric, v_course.price, 0);
    v_category := COALESCE(v_snapshot->'general'->>'category', v_course.category, 'business');
    v_hero_image := COALESCE(v_snapshot->'general'->>'heroImage', v_course.cover_image);
    v_status := COALESCE(v_course.status, 'draft');
    
    -- Pour Beyond No School, forcer target_audience à "apprenant"
    IF v_assignment_type = 'no_school' THEN
      v_target_audience := 'apprenant';
    END IF;
    
    -- Déterminer si le catalog_item doit être actif
    v_should_be_active := v_assignment_type = 'no_school' OR v_status = 'published' OR v_target_audience = 'apprenant';
    
    RAISE NOTICE '';
    RAISE NOTICE '📚 Formation: %', v_title;
    RAISE NOTICE '   ID: %', v_course.id;
    RAISE NOTICE '   Status: %', v_status;
    RAISE NOTICE '   assignment_type: %', v_assignment_type;
    RAISE NOTICE '   target_audience: %', v_target_audience;
    RAISE NOTICE '   should_be_active: %', v_should_be_active;
    
    -- Vérifier si un catalog_item existe
    SELECT id INTO v_catalog_item_id
    FROM catalog_items
    WHERE content_id = v_course.id
      AND item_type = 'module'
      AND creator_id = v_tim_user_id
    LIMIT 1;
    
    IF v_catalog_item_id IS NULL THEN
      RAISE NOTICE '   ❌ PROBLÈME: Pas de catalog_item trouvé';
      
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
        v_target_audience,
        v_tim_user_id,
        v_tim_user_id,
        v_should_be_active,
        v_course.created_at,
        v_course.updated_at
      ) RETURNING id INTO v_catalog_item_id;
      
      RAISE NOTICE '   ✅ Catalog item créé avec ID: %', v_catalog_item_id;
      v_courses_fixed := v_courses_fixed + 1;
    ELSE
      RAISE NOTICE '   ✅ Catalog item existe (ID: %)', v_catalog_item_id;
      
      -- Vérifier si le catalog_item est correct
      DECLARE
        v_current_is_active BOOLEAN;
        v_current_target_audience TEXT;
        v_needs_update BOOLEAN := FALSE;
      BEGIN
        SELECT is_active, target_audience INTO v_current_is_active, v_current_target_audience
        FROM catalog_items
        WHERE id = v_catalog_item_id;
        
        -- Vérifier si des corrections sont nécessaires
        IF v_current_is_active != v_should_be_active THEN
          RAISE NOTICE '   ⚠️  is_active incorrect: % (devrait être %)', v_current_is_active, v_should_be_active;
          v_needs_update := TRUE;
        END IF;
        
        IF v_current_target_audience != v_target_audience THEN
          RAISE NOTICE '   ⚠️  target_audience incorrect: % (devrait être %)', v_current_target_audience, v_target_audience;
          v_needs_update := TRUE;
        END IF;
        
        IF v_needs_update THEN
          UPDATE catalog_items
          SET
            is_active = v_should_be_active,
            target_audience = v_target_audience,
            title = v_title,
            description = v_subtitle,
            short_description = COALESCE(LEFT(v_subtitle, 150), ''),
            price = v_price,
            is_free = (v_price = 0),
            category = v_category,
            hero_image_url = COALESCE(v_hero_image, hero_image_url),
            thumbnail_url = COALESCE(v_hero_image, thumbnail_url),
            updated_at = NOW()
          WHERE id = v_catalog_item_id;
          
          RAISE NOTICE '   ✅ Catalog item mis à jour';
          v_courses_fixed := v_courses_fixed + 1;
        END IF;
      END;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   Formations vérifiées: %', v_courses_checked;
  RAISE NOTICE '   Formations corrigées: %', v_courses_fixed;
  RAISE NOTICE '================================================';
END $$;

-- Vérifier les catalog_items orphelins (sans course correspondant)
RAISE NOTICE '';
RAISE NOTICE '🔍 Vérification des catalog_items orphelins...';
SELECT 
  ci.id,
  ci.title,
  ci.content_id,
  ci.creator_id,
  ci.is_active,
  ci.target_audience
FROM catalog_items ci
WHERE ci.item_type = 'module'
  AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5'
  AND NOT EXISTS (
    SELECT 1 FROM courses c WHERE c.id = ci.content_id
  );


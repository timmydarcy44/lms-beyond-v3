-- Script pour synchroniser tous les contenus (formations, ressources, tests) avec catalog_items
-- Pour Beyond No School - Super Admin Tim (timdarcypro@gmail.com)
-- =========================================================================

DO $$
DECLARE
  super_admin_id UUID := '60c88469-3c53-417f-a81d-565a662ad2f5'; -- Tim
  courses_synced INTEGER := 0;
  resources_synced INTEGER := 0;
  tests_synced INTEGER := 0;
  courses_updated INTEGER := 0;
  resources_updated INTEGER := 0;
  tests_updated INTEGER := 0;
  course_record RECORD;
  resource_record RECORD;
  test_record RECORD;
  catalog_item_id UUID;
  assignment_type TEXT;
  target_audience TEXT;
  should_be_active BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Synchronisation des contenus avec catalog_items';
  RAISE NOTICE 'Super Admin: %', super_admin_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- =========================================================================
  -- 1. SYNCHRONISER LES FORMATIONS (COURSES)
  -- =========================================================================
  RAISE NOTICE '1. Synchronisation des formations...';
  
  FOR course_record IN
    SELECT 
      c.id,
      c.title,
      c.description,
      c.builder_snapshot->'general'->>'title' as snapshot_title,
      c.builder_snapshot->'general'->>'subtitle' as subtitle,
      c.builder_snapshot->'general'->>'category' as category,
      c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
      c.builder_snapshot->'general'->>'target_audience' as target_audience,
      c.builder_snapshot->'general'->>'price' as price_str,
      c.builder_snapshot->'general'->>'heroImage' as hero_image,
      c.cover_image,
      c.status,
      c.created_at,
      c.updated_at
    FROM courses c
    WHERE c.creator_id = super_admin_id
    ORDER BY c.created_at DESC
  LOOP
    -- Déterminer les valeurs
    assignment_type := COALESCE(course_record.assignment_type, 'no_school');
    target_audience := CASE 
      WHEN assignment_type = 'no_school' THEN 'apprenant'
      WHEN course_record.target_audience = 'apprenant' THEN 'apprenant'
      ELSE COALESCE(course_record.target_audience, 'all')
    END;
    
    should_be_active := assignment_type = 'no_school' OR course_record.status = 'published' OR target_audience = 'apprenant';
    
    -- Vérifier si un catalog_item existe
    SELECT id INTO catalog_item_id
    FROM catalog_items
    WHERE content_id = course_record.id
      AND item_type = 'module'
      AND creator_id = super_admin_id
    LIMIT 1;
    
    IF catalog_item_id IS NULL THEN
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
        course_record.id,
        'module',
        COALESCE(course_record.snapshot_title, course_record.title),
        course_record.subtitle,
        COALESCE(LEFT(course_record.subtitle, 150), LEFT(course_record.description, 150), ''),
        COALESCE((course_record.price_str::numeric), 0),
        COALESCE((course_record.price_str::numeric), 0) = 0,
        COALESCE(course_record.category, 'business'),
        COALESCE(course_record.hero_image, course_record.cover_image),
        COALESCE(course_record.hero_image, course_record.cover_image),
        target_audience,
        super_admin_id,
        super_admin_id,
        should_be_active,
        course_record.created_at,
        course_record.updated_at
      );
      
      courses_synced := courses_synced + 1;
      RAISE NOTICE '  ✅ Formation ajoutée: %', COALESCE(course_record.snapshot_title, course_record.title);
    ELSE
      -- Mettre à jour le catalog_item existant
      UPDATE catalog_items
      SET
        title = COALESCE(course_record.snapshot_title, course_record.title),
        description = course_record.subtitle,
        short_description = COALESCE(LEFT(course_record.subtitle, 150), LEFT(course_record.description, 150), short_description),
        price = COALESCE((course_record.price_str::numeric), price),
        is_free = COALESCE((course_record.price_str::numeric), price) = 0,
        category = COALESCE(course_record.category, category),
        hero_image_url = COALESCE(course_record.hero_image, course_record.cover_image, hero_image_url),
        thumbnail_url = COALESCE(course_record.hero_image, course_record.cover_image, thumbnail_url),
        target_audience = target_audience,
        is_active = should_be_active,
        updated_at = NOW()
      WHERE id = catalog_item_id;
      
      courses_updated := courses_updated + 1;
      RAISE NOTICE '  🔄 Formation mise à jour: %', COALESCE(course_record.snapshot_title, course_record.title);
    END IF;
  END LOOP;
  
  RAISE NOTICE '  Total formations: % créées, % mises à jour', courses_synced, courses_updated;
  RAISE NOTICE '';

  -- =========================================================================
  -- 2. SYNCHRONISER LES RESSOURCES
  -- =========================================================================
  RAISE NOTICE '2. Synchronisation des ressources...';
  
  FOR resource_record IN
    SELECT 
      r.id,
      r.title,
      r.description,
      r.kind,
      r.price,
      r.category,
      r.thumbnail_url,
      r.cover_url,
      r.hero_image_url,
      r.status,
      r.published,
      r.created_at,
      r.updated_at
    FROM resources r
    WHERE r.created_by = super_admin_id
    ORDER BY r.created_at DESC
  LOOP
    -- Déterminer le statut (support status text ET published boolean)
    should_be_active := COALESCE(resource_record.status = 'published', resource_record.published, false);
    
    -- Vérifier si un catalog_item existe
    SELECT id INTO catalog_item_id
    FROM catalog_items
    WHERE content_id = resource_record.id
      AND item_type = 'ressource'
      AND creator_id = super_admin_id
    LIMIT 1;
    
    IF catalog_item_id IS NULL THEN
      -- Créer le catalog_item seulement si publié
      IF should_be_active THEN
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
          resource_record.id,
          'ressource',
          resource_record.title,
          resource_record.description,
          COALESCE(LEFT(resource_record.description, 150), ''),
          COALESCE(resource_record.price, 0),
          COALESCE(resource_record.price, 0) = 0,
          resource_record.category,
          COALESCE(resource_record.hero_image_url, resource_record.cover_url),
          COALESCE(resource_record.thumbnail_url, resource_record.cover_url),
          'apprenant', -- Par défaut pour Beyond No School
          super_admin_id,
          super_admin_id,
          true,
          resource_record.created_at,
          resource_record.updated_at
        );
        
        resources_synced := resources_synced + 1;
        RAISE NOTICE '  ✅ Ressource ajoutée: %', resource_record.title;
      END IF;
    ELSE
      -- Mettre à jour le catalog_item existant
      UPDATE catalog_items
      SET
        title = resource_record.title,
        description = resource_record.description,
        short_description = COALESCE(LEFT(resource_record.description, 150), short_description),
        price = COALESCE(resource_record.price, price),
        is_free = COALESCE(resource_record.price, price) = 0,
        category = COALESCE(resource_record.category, category),
        hero_image_url = COALESCE(resource_record.hero_image_url, resource_record.cover_url, hero_image_url),
        thumbnail_url = COALESCE(resource_record.thumbnail_url, resource_record.cover_url, thumbnail_url),
        target_audience = 'apprenant',
        is_active = should_be_active,
        updated_at = NOW()
      WHERE id = catalog_item_id;
      
      resources_updated := resources_updated + 1;
      RAISE NOTICE '  🔄 Ressource mise à jour: %', resource_record.title;
    END IF;
  END LOOP;
  
  RAISE NOTICE '  Total ressources: % créées, % mises à jour', resources_synced, resources_updated;
  RAISE NOTICE '';

  -- =========================================================================
  -- 3. SYNCHRONISER LES TESTS
  -- =========================================================================
  RAISE NOTICE '3. Synchronisation des tests...';
  
  FOR test_record IN
    SELECT 
      t.id,
      t.title,
      t.description,
      t.kind,
      t.price,
      t.category,
      t.cover_image,
      t.hero_image_url,
      t.thumbnail_url,
      t.status,
      t.published,
      t.created_at,
      t.updated_at
    FROM tests t
    WHERE t.created_by = super_admin_id
    ORDER BY t.created_at DESC
  LOOP
    -- Déterminer le statut (support status text ET published boolean)
    should_be_active := COALESCE(test_record.status = 'published', test_record.published, false);
    
    -- Vérifier si un catalog_item existe
    SELECT id INTO catalog_item_id
    FROM catalog_items
    WHERE content_id = test_record.id
      AND item_type = 'test'
      AND creator_id = super_admin_id
    LIMIT 1;
    
    IF catalog_item_id IS NULL THEN
      -- Créer le catalog_item seulement si publié
      IF should_be_active THEN
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
          test_record.id,
          'test',
          test_record.title,
          test_record.description,
          COALESCE(LEFT(test_record.description, 150), ''),
          COALESCE(test_record.price, 0),
          COALESCE(test_record.price, 0) = 0,
          test_record.category,
          COALESCE(test_record.hero_image_url, test_record.cover_image),
          COALESCE(test_record.thumbnail_url, test_record.cover_image),
          'apprenant', -- Par défaut pour Beyond No School
          super_admin_id,
          super_admin_id,
          true,
          test_record.created_at,
          test_record.updated_at
        );
        
        tests_synced := tests_synced + 1;
        RAISE NOTICE '  ✅ Test ajouté: %', test_record.title;
      END IF;
    ELSE
      -- Mettre à jour le catalog_item existant
      UPDATE catalog_items
      SET
        title = test_record.title,
        description = test_record.description,
        short_description = COALESCE(LEFT(test_record.description, 150), short_description),
        price = COALESCE(test_record.price, price),
        is_free = COALESCE(test_record.price, price) = 0,
        category = COALESCE(test_record.category, category),
        hero_image_url = COALESCE(test_record.hero_image_url, test_record.cover_image, hero_image_url),
        thumbnail_url = COALESCE(test_record.thumbnail_url, test_record.cover_image, thumbnail_url),
        target_audience = 'apprenant',
        is_active = should_be_active,
        updated_at = NOW()
      WHERE id = catalog_item_id;
      
      tests_updated := tests_updated + 1;
      RAISE NOTICE '  🔄 Test mis à jour: %', test_record.title;
    END IF;
  END LOOP;
  
  RAISE NOTICE '  Total tests: % créés, % mis à jour', tests_synced, tests_updated;
  RAISE NOTICE '';

  -- =========================================================================
  -- 4. NETTOYER LES DOUBLONS
  -- =========================================================================
  RAISE NOTICE '4. Nettoyage des doublons...';
  
  WITH duplicates AS (
    SELECT 
      content_id,
      item_type,
      creator_id,
      array_agg(id ORDER BY created_at DESC) as item_ids
    FROM catalog_items
    WHERE creator_id = super_admin_id
      AND content_id IS NOT NULL
    GROUP BY content_id, item_type, creator_id
    HAVING COUNT(*) > 1
  )
  DELETE FROM catalog_items
  WHERE id IN (
    SELECT unnest(item_ids[2:array_length(item_ids, 1)])
    FROM duplicates
  );
  
  GET DIAGNOSTICS courses_updated = ROW_COUNT;
  RAISE NOTICE '  🗑️ Doublons supprimés: %', courses_updated;
  RAISE NOTICE '';

  -- =========================================================================
  -- 5. RÉSUMÉ FINAL
  -- =========================================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Résumé de la synchronisation';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Formations: % créées, % mises à jour', courses_synced, courses_updated;
  RAISE NOTICE 'Ressources: % créées, % mises à jour', resources_synced, resources_updated;
  RAISE NOTICE 'Tests: % créés, % mis à jour', tests_synced, tests_updated;
  RAISE NOTICE 'Doublons supprimés: %', courses_updated;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Synchronisation terminée !';
  RAISE NOTICE '========================================';

END $$;

-- Vérification finale : compter les items dans le catalogue
SELECT 
  item_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as actifs,
  COUNT(*) FILTER (WHERE target_audience = 'apprenant') as pour_apprenants
FROM catalog_items
WHERE creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5'
GROUP BY item_type
ORDER BY item_type;



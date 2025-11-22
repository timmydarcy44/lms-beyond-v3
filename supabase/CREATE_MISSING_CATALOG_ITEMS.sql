-- Script pour créer les catalog_items manquants pour les formations Beyond No School
-- Ce script crée les catalog_items pour toutes les formations publiées qui n'en ont pas

DO $$
DECLARE
  v_tim_user_id UUID := '60c88469-3c53-417f-a81d-565a662ad2f5';
  v_course RECORD;
  v_catalog_item_id UUID;
  v_title TEXT;
  v_subtitle TEXT;
  v_price NUMERIC;
  v_category TEXT;
  v_hero_image TEXT;
  v_snapshot JSONB;
  v_items_created INTEGER := 0;
BEGIN
  RAISE NOTICE '🔧 Création des catalog_items manquants...';
  RAISE NOTICE '================================================';
  
  -- Parcourir toutes les formations publiées de Tim qui n'ont pas de catalog_item
  FOR v_course IN
    SELECT 
      c.id,
      c.title,
      c.description,
      c.builder_snapshot,
      c.cover_image,
      c.price,
      c.category,
      c.created_at,
      c.updated_at
    FROM courses c
    WHERE (c.creator_id = v_tim_user_id OR c.owner_id = v_tim_user_id)
      AND c.status = 'published'
      AND NOT EXISTS (
        SELECT 1 
        FROM catalog_items ci 
        WHERE ci.content_id = c.id 
          AND ci.item_type = 'module' 
          AND ci.creator_id = v_tim_user_id
      )
    ORDER BY c.created_at DESC
  LOOP
    -- Extraire les valeurs du snapshot
    v_snapshot := v_course.builder_snapshot;
    v_title := COALESCE(v_snapshot->'general'->>'title', v_course.title);
    v_subtitle := COALESCE(v_snapshot->'general'->>'subtitle', v_course.description, '');
    v_price := COALESCE((v_snapshot->'general'->>'price')::numeric, v_course.price, 0);
    v_category := COALESCE(v_snapshot->'general'->>'category', v_course.category, 'business');
    v_hero_image := COALESCE(v_snapshot->'general'->>'heroImage', v_course.cover_image);
    
    RAISE NOTICE '';
    RAISE NOTICE '📚 Formation: %', v_title;
    RAISE NOTICE '   ID: %', v_course.id;
    
    -- Créer le catalog_item
    BEGIN
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
        'apprenant', -- Toujours "apprenant" pour Beyond No School
        v_tim_user_id,
        v_tim_user_id,
        true, -- Toujours actif pour Beyond No School
        v_course.created_at,
        v_course.updated_at
      ) RETURNING id INTO v_catalog_item_id;
      
      RAISE NOTICE '   ✅ Catalog item créé avec ID: %', v_catalog_item_id;
      v_items_created := v_items_created + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '   ❌ Erreur lors de la création: %', SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   Catalog items créés: %', v_items_created;
  RAISE NOTICE '================================================';
END $$;

-- Vérification : lister toutes les formations qui n'ont toujours pas de catalog_item
SELECT 
  c.id as course_id,
  c.title as course_title,
  c.status as course_status,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM catalog_items ci 
      WHERE ci.content_id = c.id 
        AND ci.item_type = 'module' 
        AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5'
    ) THEN '❌ Toujours pas de catalog_item'
    ELSE '✅ Catalog item créé'
  END as status
FROM courses c
WHERE (c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' 
   OR c.owner_id = '60c88469-3c53-417f-a81d-565a662ad2f5')
  AND c.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM catalog_items ci 
    WHERE ci.content_id = c.id 
      AND ci.item_type = 'module' 
      AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5'
  )
ORDER BY c.created_at DESC;


-- Script pour supprimer les doublons de formations "Qu'est-ce que le TDAH ?"
-- Garde le course le plus récent et supprime les autres

DO $$
DECLARE
  v_jessica_user_id UUID := '17364229-fe78-4986-ac69-41b880e34631'; -- ID de Jessica Contentin
  v_course_to_keep UUID;
  v_courses_to_delete UUID[];
  v_catalog_items_to_delete UUID[];
  v_access_to_delete INTEGER;
BEGIN
  RAISE NOTICE '🔧 Suppression des doublons de formations "Qu''est-ce que le TDAH ?"...';
  RAISE NOTICE '================================================';
  
  -- Trouver tous les courses avec le titre "Qu'est-ce que le TDAH ?" créés par Jessica
  SELECT ARRAY_AGG(id ORDER BY created_at DESC)
  INTO v_courses_to_delete
  FROM courses
  WHERE title ILIKE '%Qu''est-ce que le TDAH ?%'
    AND creator_id = v_jessica_user_id;
  
  IF v_courses_to_delete IS NULL OR array_length(v_courses_to_delete, 1) <= 1 THEN
    RAISE NOTICE '✅ Aucun doublon trouvé ou un seul course existe.';
    RETURN;
  END IF;
  
  -- Garder le course le plus récent (premier de la liste triée par created_at DESC)
  v_course_to_keep := v_courses_to_delete[1];
  
  -- Supprimer les autres courses (du 2ème au dernier)
  v_courses_to_delete := v_courses_to_delete[2:array_length(v_courses_to_delete, 1)];
  
  RAISE NOTICE '';
  RAISE NOTICE '📚 Course à conserver: %', v_course_to_keep;
  RAISE NOTICE '🗑️  Courses à supprimer: %', array_to_string(v_courses_to_delete, ', ');
  
  -- Trouver les catalog_items associés aux courses à supprimer
  SELECT ARRAY_AGG(id)
  INTO v_catalog_items_to_delete
  FROM catalog_items
  WHERE content_id = ANY(v_courses_to_delete)
    AND item_type = 'module';
  
  IF v_catalog_items_to_delete IS NOT NULL AND array_length(v_catalog_items_to_delete, 1) > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '📦 Catalog items à supprimer: %', array_to_string(v_catalog_items_to_delete, ', ');
    
    -- Supprimer les accès associés aux catalog_items
    DELETE FROM catalog_access
    WHERE catalog_item_id = ANY(v_catalog_items_to_delete);
    
    GET DIAGNOSTICS v_access_to_delete = ROW_COUNT;
    RAISE NOTICE '   ✅ % accès supprimés', v_access_to_delete;
    
    -- Supprimer les catalog_items
    DELETE FROM catalog_items
    WHERE id = ANY(v_catalog_items_to_delete);
    
    RAISE NOTICE '   ✅ % catalog items supprimés', array_length(v_catalog_items_to_delete, 1);
  END IF;
  
  -- Supprimer les courses dupliqués
  DELETE FROM courses
  WHERE id = ANY(v_courses_to_delete);
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ % courses dupliqués supprimés', array_length(v_courses_to_delete, 1);
  RAISE NOTICE '';
  RAISE NOTICE '✅ Nettoyage terminé avec succès !';
  RAISE NOTICE '================================================';
END $$;


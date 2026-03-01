-- Script pour supprimer les doublons de formations "Qu'est-ce que le TDAH ?"
-- Garde le course le plus récent et supprime les autres
-- ATTENTION : Ne supprime PAS les courses qui ont des inscriptions ou sont dans des parcours

DO $$
DECLARE
  v_jessica_user_id UUID := '17364229-fe78-4986-ac69-41b880e34631'; -- ID de Jessica Contentin
  v_course_to_keep UUID;
  v_all_courses UUID[];
  v_courses_to_delete UUID[];
  v_catalog_items_to_delete UUID[];
  v_access_to_delete INTEGER;
  v_course_id UUID;
  v_has_enrollments BOOLEAN;
  v_in_paths BOOLEAN;
  v_safe_to_delete UUID[];
  v_skipped_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔧 Suppression des doublons de formations "Qu''est-ce que le TDAH ?"...';
  RAISE NOTICE '================================================';
  
  -- Trouver tous les courses avec le titre "Qu'est-ce que le TDAH ?" créés par Jessica
  SELECT ARRAY_AGG(id ORDER BY updated_at DESC, created_at DESC)
  INTO v_all_courses
  FROM courses
  WHERE title ILIKE '%Qu''est-ce que le TDAH ?%'
    AND creator_id = v_jessica_user_id;
  
  IF v_all_courses IS NULL OR array_length(v_all_courses, 1) <= 1 THEN
    RAISE NOTICE '✅ Aucun doublon trouvé ou un seul course existe.';
    RETURN;
  END IF;
  
  -- Garder le course le plus récent (premier de la liste triée)
  v_course_to_keep := v_all_courses[1];
  
  -- Vérifier chaque course à supprimer pour les dépendances
  v_safe_to_delete := ARRAY[]::UUID[];
  
  FOR i IN 2..array_length(v_all_courses, 1) LOOP
    v_course_id := v_all_courses[i];
    
    -- Vérifier si le course a des inscriptions
    SELECT EXISTS(
      SELECT 1 FROM enrollments WHERE course_id = v_course_id
    ) INTO v_has_enrollments;
    
    -- Vérifier si le course est dans un parcours
    SELECT EXISTS(
      SELECT 1 FROM path_courses WHERE course_id = v_course_id
    ) INTO v_in_paths;
    
    IF v_has_enrollments OR v_in_paths THEN
      RAISE NOTICE '⚠️  Course % ne sera PAS supprimé (a des inscriptions: %, dans un parcours: %)', 
        v_course_id, v_has_enrollments, v_in_paths;
      v_skipped_count := v_skipped_count + 1;
    ELSE
      v_safe_to_delete := array_append(v_safe_to_delete, v_course_id);
    END IF;
  END LOOP;
  
  IF array_length(v_safe_to_delete, 1) IS NULL OR array_length(v_safe_to_delete, 1) = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Aucun course ne peut être supprimé (tous ont des dépendances).';
    IF v_skipped_count > 0 THEN
      RAISE NOTICE '   % course(s) ignoré(s) car protégé(s) par des dépendances.', v_skipped_count;
    END IF;
    RETURN;
  END IF;
  
  v_courses_to_delete := v_safe_to_delete;
  
  RAISE NOTICE '';
  RAISE NOTICE '📚 Course à conserver: %', v_course_to_keep;
  RAISE NOTICE '🗑️  Courses à supprimer: %', array_to_string(v_courses_to_delete, ', ');
  IF v_skipped_count > 0 THEN
    RAISE NOTICE '⚠️  % course(s) ignoré(s) car protégé(s) par des dépendances.', v_skipped_count;
  END IF;
  
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

-- Vérification après suppression
SELECT 
  'Vérification après suppression' as info,
  COUNT(*) as total_tdah_courses,
  array_agg(id::text ORDER BY created_at DESC) as remaining_course_ids,
  array_agg(title ORDER BY created_at DESC) as remaining_titles
FROM courses
WHERE title ILIKE '%Qu''est-ce que le TDAH ?%'
  AND creator_id = '17364229-fe78-4986-ac69-41b880e34631';

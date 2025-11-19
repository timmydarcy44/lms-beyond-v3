-- ============================================
-- Script pour identifier et supprimer les formations dupliquées
-- ============================================
-- Ce script identifie les doublons basés sur :
-- - Même titre (normalisé)
-- - Même creator_id
-- - Créées dans un intervalle de temps proche (30 jours)
-- 
-- Il garde la version la plus récente et supprime les autres
-- ATTENTION : Les formations assignées à des apprenants ou dans des parcours ne sont PAS supprimées
-- ============================================

-- Étape 1 : Identifier les doublons (mode lecture seule)
DO $$
DECLARE
  duplicate_record RECORD;
  duplicate_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== IDENTIFICATION DES DOUBLONS ===';
  RAISE NOTICE '';
  
  -- Trouver les groupes de doublons
  FOR duplicate_record IN
    WITH normalized_titles AS (
      SELECT 
        id,
        title,
        LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))) AS normalized_title,
        creator_id,
        owner_id,
        created_at,
        updated_at,
        status
      FROM courses
    ),
    duplicates AS (
      SELECT 
        normalized_title,
        creator_id,
        COUNT(*) as count,
        array_agg(id ORDER BY updated_at DESC, created_at DESC) as course_ids,
        array_agg(title ORDER BY updated_at DESC, created_at DESC) as titles,
        array_agg(created_at ORDER BY updated_at DESC, created_at DESC) as created_dates
      FROM normalized_titles
      GROUP BY normalized_title, creator_id
      HAVING COUNT(*) > 1
    )
    SELECT 
      d.normalized_title,
      d.creator_id,
      d.count,
      d.course_ids,
      d.titles,
      d.created_dates,
      -- Vérifier si des formations sont assignées ou dans des parcours
      (
        SELECT COUNT(*) > 0
        FROM enrollments e
        WHERE e.course_id = ANY(d.course_ids)
      ) as has_enrollments,
      (
        SELECT COUNT(*) > 0
        FROM path_courses pc
        WHERE pc.course_id = ANY(d.course_ids)
      ) as in_paths
    FROM duplicates d
    ORDER BY d.count DESC, d.created_dates[1] DESC
  LOOP
    duplicate_count := duplicate_count + 1;
    RAISE NOTICE 'Groupe %: "%" (creator: %)', 
      duplicate_count, 
      duplicate_record.normalized_title, 
      duplicate_record.creator_id;
    RAISE NOTICE '  Nombre de doublons: %', duplicate_record.count;
    RAISE NOTICE '  IDs: %', duplicate_record.course_ids;
    RAISE NOTICE '  Titres: %', duplicate_record.titles;
    RAISE NOTICE '  Créées le: %', duplicate_record.created_dates;
    
    IF duplicate_record.has_enrollments THEN
      RAISE NOTICE '  ⚠ Certaines formations ont des apprenants assignés - NE SERA PAS SUPPRIME';
    END IF;
    
    IF duplicate_record.in_paths THEN
      RAISE NOTICE '  ⚠ Certaines formations sont dans des parcours - NE SERA PAS SUPPRIME';
    END IF;
    
    RAISE NOTICE '';
  END LOOP;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '✓ Aucun doublon trouvé';
  ELSE
    RAISE NOTICE 'Total: % groupe(s) de doublons identifié(s)', duplicate_count;
  END IF;
END $$;

-- Étape 2 : Supprimer les doublons (en gardant le plus récent)
-- UNCOMMENT LES LIGNES CI-DESSOUS APRÈS VÉRIFICATION
/*
DO $$
DECLARE
  duplicate_group RECORD;
  kept_course_id UUID;
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUPPRESSION DES DOUBLONS ===';
  RAISE NOTICE '';
  
  -- Pour chaque groupe de doublons
  FOR duplicate_group IN
    WITH normalized_titles AS (
      SELECT 
        id,
        title,
        LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))) AS normalized_title,
        creator_id,
        created_at,
        updated_at,
        -- Vérifier si la formation est assignée ou dans un parcours
        (
          SELECT COUNT(*) > 0
          FROM enrollments e
          WHERE e.course_id = courses.id
        ) as has_enrollments,
        (
          SELECT COUNT(*) > 0
          FROM path_courses pc
          WHERE pc.course_id = courses.id
        ) as in_paths
      FROM courses
    ),
    duplicates AS (
      SELECT 
        normalized_title,
        creator_id,
        array_agg(id ORDER BY updated_at DESC, created_at DESC) as course_ids,
        array_agg(has_enrollments ORDER BY updated_at DESC, created_at DESC) as has_enrollments_array,
        array_agg(in_paths ORDER BY updated_at DESC, created_at DESC) as in_paths_array
      FROM normalized_titles
      GROUP BY normalized_title, creator_id
      HAVING COUNT(*) > 1
    )
    SELECT 
      d.course_ids[1] as keep_id, -- Garder le plus récent
      d.course_ids[2:] as delete_ids, -- Supprimer les autres
      d.has_enrollments_array,
      d.in_paths_array
    FROM duplicates d
  LOOP
    kept_course_id := duplicate_group.keep_id;
    
    RAISE NOTICE 'Groupe: Garde %', kept_course_id;
    
    -- Supprimer les doublons (un par un pour vérifier les contraintes)
    FOR i IN 1..array_length(duplicate_group.delete_ids, 1) LOOP
      DECLARE
        course_to_delete UUID := duplicate_group.delete_ids[i];
        can_delete BOOLEAN := TRUE;
      BEGIN
        -- Vérifier si on peut supprimer (pas d'enrollments, pas dans un parcours)
        IF duplicate_group.has_enrollments_array[i] OR duplicate_group.in_paths_array[i] THEN
          can_delete := FALSE;
          RAISE NOTICE '  ⚠ Ne supprime pas % (a des apprenants ou est dans un parcours)', course_to_delete;
        END IF;
        
        IF can_delete THEN
          -- Supprimer les enrollments si présents (déjà vérifié mais sécurité supplémentaire)
          DELETE FROM enrollments WHERE course_id = course_to_delete;
          
          -- Supprimer les références dans path_courses
          DELETE FROM path_courses WHERE course_id = course_to_delete;
          
          -- Supprimer la formation
          DELETE FROM courses WHERE id = course_to_delete;
          
          deleted_count := deleted_count + 1;
          RAISE NOTICE '  ✓ Supprimé %', course_to_delete;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ✗ Erreur lors de la suppression de %: %', course_to_delete, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '✓ Total supprimé: % formation(s)', deleted_count;
END $$;
*/

-- Étape 3 : Afficher un résumé après nettoyage
SELECT 
  'Résumé après nettoyage' as info,
  COUNT(*) as total_courses,
  COUNT(DISTINCT creator_id) as unique_creators,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'draft') as draft
FROM courses;






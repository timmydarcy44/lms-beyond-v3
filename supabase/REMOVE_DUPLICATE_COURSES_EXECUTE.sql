-- ============================================
-- Script pour SUPPRIMER les formations dupliquées
-- ============================================
-- Ce script :
-- 1. Identifie les doublons (même titre, même créateur)
-- 2. Garde la version la plus récente (updated_at DESC)
-- 3. Supprime les autres SAUF si elles ont des apprenants ou sont dans des parcours
-- ============================================

BEGIN;

-- Afficher les doublons qui seront supprimés
DO $$
DECLARE
  duplicate_info RECORD;
BEGIN
  RAISE NOTICE '=== IDENTIFICATION DES DOUBLONS À SUPPRIMER ===';
  RAISE NOTICE '';
  
  FOR duplicate_info IN
    WITH normalized_courses AS (
      SELECT 
        id,
        title,
        LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))) AS normalized_title,
        creator_id,
        created_at,
        updated_at,
        -- Vérifier si la formation est utilisée
        EXISTS(SELECT 1 FROM enrollments WHERE course_id = courses.id) as has_enrollments,
        EXISTS(SELECT 1 FROM path_courses WHERE course_id = courses.id) as in_paths,
        ROW_NUMBER() OVER (
          PARTITION BY 
            LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))), 
            creator_id
          ORDER BY updated_at DESC, created_at DESC
        ) as rn
      FROM courses
    )
    SELECT 
      normalized_title,
      creator_id,
      array_agg(id ORDER BY updated_at DESC, created_at DESC) as all_ids,
      array_agg(id ORDER BY updated_at DESC, created_at DESC) FILTER (WHERE rn > 1) as to_delete_ids,
      array_agg(id ORDER BY updated_at DESC, created_at DESC) FILTER (WHERE rn = 1) as kept_id,
      array_agg(has_enrollments) FILTER (WHERE rn > 1) as has_enrollments_array,
      array_agg(in_paths) FILTER (WHERE rn > 1) as in_paths_array,
      COUNT(*) FILTER (WHERE rn > 1) as duplicate_count
    FROM normalized_courses
    GROUP BY normalized_title, creator_id
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
  LOOP
    RAISE NOTICE 'Groupe: "%" (creator: %)', duplicate_info.normalized_title, duplicate_info.creator_id;
    RAISE NOTICE '  → Garde: %', duplicate_info.kept_id[1];
    RAISE NOTICE '  → Supprime: %', duplicate_info.to_delete_ids;
    
    -- Vérifier les protections
    FOR i IN 1..array_length(duplicate_info.to_delete_ids, 1) LOOP
      IF duplicate_info.has_enrollments_array[i] THEN
        RAISE NOTICE '    ⚠ % a des apprenants - NE SERA PAS SUPPRIMÉ', duplicate_info.to_delete_ids[i];
      ELSIF duplicate_info.in_paths_array[i] THEN
        RAISE NOTICE '    ⚠ % est dans un parcours - NE SERA PAS SUPPRIMÉ', duplicate_info.to_delete_ids[i];
      ELSE
        RAISE NOTICE '    ✓ % sera supprimé', duplicate_info.to_delete_ids[i];
      END IF;
    END LOOP;
    
    RAISE NOTICE '';
  END LOOP;
END $$;

-- Supprimer les doublons
DO $$
DECLARE
  deleted_count INTEGER := 0;
  skipped_count INTEGER := 0;
  course_to_delete UUID;
BEGIN
  RAISE NOTICE '=== SUPPRESSION EN COURS ===';
  RAISE NOTICE '';
  
  -- Parcourir tous les doublons à supprimer
  FOR course_to_delete IN
    WITH normalized_courses AS (
      SELECT 
        id,
        title,
        LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))) AS normalized_title,
        creator_id,
        created_at,
        updated_at,
        EXISTS(SELECT 1 FROM enrollments WHERE course_id = courses.id) as has_enrollments,
        EXISTS(SELECT 1 FROM path_courses WHERE course_id = courses.id) as in_paths,
        ROW_NUMBER() OVER (
          PARTITION BY 
            LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))), 
            creator_id
          ORDER BY updated_at DESC, created_at DESC
        ) as rn
      FROM courses
    )
    SELECT id
    FROM normalized_courses
    WHERE rn > 1
      AND NOT has_enrollments  -- Ne pas supprimer si a des apprenants
      AND NOT in_paths          -- Ne pas supprimer si dans un parcours
  LOOP
    BEGIN
      -- Supprimer les références dans enrollments (sécurité supplémentaire)
      DELETE FROM enrollments WHERE course_id = course_to_delete;
      
      -- Supprimer les références dans path_courses (sécurité supplémentaire)
      DELETE FROM path_courses WHERE course_id = course_to_delete;
      
      -- Supprimer la formation
      DELETE FROM courses WHERE id = course_to_delete;
      
      deleted_count := deleted_count + 1;
      RAISE NOTICE '✓ Supprimé: %', course_to_delete;
    EXCEPTION WHEN OTHERS THEN
      skipped_count := skipped_count + 1;
      RAISE NOTICE '✗ Erreur pour %: %', course_to_delete, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RÉSULTAT ===';
  RAISE NOTICE '✓ Supprimé: % formation(s)', deleted_count;
  IF skipped_count > 0 THEN
    RAISE NOTICE '⚠ Ignoré: % formation(s) (erreurs)', skipped_count;
  END IF;
END $$;

-- Afficher le résumé final
DO $$
DECLARE
  total_courses INTEGER;
  total_published INTEGER;
  total_draft INTEGER;
BEGIN
  SELECT COUNT(*), 
         COUNT(*) FILTER (WHERE status = 'published'),
         COUNT(*) FILTER (WHERE status = 'draft')
  INTO total_courses, total_published, total_draft
  FROM courses;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RÉSUMÉ FINAL ===';
  RAISE NOTICE 'Total formations: %', total_courses;
  RAISE NOTICE '  - Publiées: %', total_published;
  RAISE NOTICE '  - Brouillons: %', total_draft;
END $$;

COMMIT;


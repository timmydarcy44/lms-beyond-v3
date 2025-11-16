-- ============================================
-- Script SIMPLIFIÉ pour supprimer les formations dupliquées
-- ============================================
-- Ce script supprime les doublons en gardant uniquement la version la plus récente
-- ============================================

-- Afficher les doublons avant suppression
WITH normalized_titles AS (
  SELECT 
    id,
    title,
    LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))) AS normalized_title,
    creator_id,
    created_at,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))), 
        creator_id
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM courses
)
SELECT 
  'AVANT SUPPRESSION - Doublons trouvés:' as status,
  normalized_title,
  creator_id,
  COUNT(*) as count,
  array_agg(id::text) as course_ids,
  array_agg(title) as titles
FROM normalized_titles
WHERE rn > 1
GROUP BY normalized_title, creator_id
ORDER BY count DESC;

-- Supprimer les doublons (garder le plus récent de chaque groupe)
-- DÉCOMMENTEZ LES LIGNES CI-DESSOUS POUR EXÉCUTER LA SUPPRESSION
/*
DELETE FROM courses
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          LOWER(TRIM(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))), 
          creator_id
        ORDER BY updated_at DESC, created_at DESC
      ) as rn
    FROM courses
  ) ranked
  WHERE rn > 1
  AND id NOT IN (
    -- NE PAS SUPPRIMER si la formation a des apprenants
    SELECT DISTINCT course_id FROM enrollments
    UNION
    -- NE PAS SUPPRIMER si la formation est dans un parcours
    SELECT DISTINCT course_id FROM path_courses
  )
);

-- Afficher le résultat
SELECT 
  'APRÈS SUPPRESSION - Total restant:' as status,
  COUNT(*) as total_courses
FROM courses;
*/





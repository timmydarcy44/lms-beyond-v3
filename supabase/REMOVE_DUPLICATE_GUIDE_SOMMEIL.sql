-- Script pour supprimer les doublons de "Le guide du sommeil"
-- Garde uniquement la version la plus récente

-- 1. Identifier les doublons
WITH duplicates AS (
  SELECT 
    id,
    title,
    created_at,
    creator_id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)) 
      ORDER BY created_at DESC
    ) as rn
  FROM courses
  WHERE LOWER(TRIM(title)) LIKE '%guide du sommeil%'
    OR LOWER(TRIM(title)) LIKE '%sommeil%'
)
SELECT 
  id,
  title,
  created_at,
  creator_id,
  rn
FROM duplicates
ORDER BY created_at DESC;

-- 2. Supprimer les doublons (garder uniquement le plus récent)
-- ATTENTION: Exécutez d'abord la requête ci-dessus pour vérifier les résultats
-- Décommentez la section ci-dessous après vérification

/*
WITH duplicates AS (
  SELECT 
    id,
    title,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)) 
      ORDER BY created_at DESC
    ) as rn
  FROM courses
  WHERE LOWER(TRIM(title)) LIKE '%guide du sommeil%'
    OR LOWER(TRIM(title)) LIKE '%sommeil%'
),
to_delete AS (
  SELECT id
  FROM duplicates
  WHERE rn > 1
)
DELETE FROM courses
WHERE id IN (SELECT id FROM to_delete);

-- Vérifier qu'il ne reste qu'une seule version
SELECT id, title, created_at, creator_id
FROM courses
WHERE LOWER(TRIM(title)) LIKE '%guide du sommeil%'
ORDER BY created_at DESC;
*/









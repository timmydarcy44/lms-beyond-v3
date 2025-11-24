-- Script simple pour corriger la formation "fixer ses prix"
-- À exécuter dans Supabase Studio → SQL Editor

-- 1. D'abord, chercher la formation
SELECT 
  c.id as course_id,
  c.title,
  c.builder_snapshot->'general'->>'title' as snapshot_title,
  c.builder_snapshot->'general'->>'category' as category,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as target_audience,
  c.creator_id,
  ci.id as catalog_item_id,
  ci.is_active as catalog_is_active,
  ci.target_audience as catalog_target_audience
FROM courses c
LEFT JOIN catalog_items ci ON ci.content_id = c.id AND ci.item_type = 'module'
WHERE c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
  AND (
    c.title ILIKE '%fixer%prix%'
    OR c.title ILIKE '%prix%'
    OR c.builder_snapshot->'general'->>'title' ILIKE '%fixer%prix%'
    OR c.builder_snapshot->'general'->>'title' ILIKE '%prix%'
  )
ORDER BY c.created_at DESC
LIMIT 5;

-- 2. Si la formation existe mais n'a pas de catalog_item, créer le catalog_item
-- Remplacez 'COURSE_ID_ICI' par l'ID de la formation trouvée ci-dessus
-- Décommentez et exécutez cette partie après avoir trouvé l'ID

/*
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
  is_active,
  created_at,
  updated_at
)
SELECT 
  c.id,
  'module',
  COALESCE(c.builder_snapshot->'general'->>'title', c.title),
  c.builder_snapshot->'general'->>'subtitle',
  COALESCE(LEFT(c.builder_snapshot->'general'->>'subtitle', 150), ''),
  COALESCE((c.builder_snapshot->'general'->>'price')::numeric, 0),
  COALESCE((c.builder_snapshot->'general'->>'price')::numeric, 0) = 0,
  COALESCE(c.builder_snapshot->'general'->>'category', 'business'),
  c.builder_snapshot->'general'->>'heroImage',
  c.builder_snapshot->'general'->>'heroImage',
  'apprenant', -- Forcer à "apprenant" pour Beyond No School
  c.creator_id,
  true, -- Actif
  NOW(),
  NOW()
FROM courses c
WHERE c.id = 'COURSE_ID_ICI' -- ⚠️ REMPLACEZ par l'ID trouvé dans la requête 1
  AND NOT EXISTS (
    SELECT 1 FROM catalog_items ci 
    WHERE ci.content_id = c.id AND ci.item_type = 'module'
  );
*/

-- 3. Si le catalog_item existe mais n'est pas actif, l'activer
-- Remplacez 'CATALOG_ITEM_ID_ICI' par l'ID du catalog_item trouvé ci-dessus
-- Décommentez et exécutez cette partie si nécessaire

/*
UPDATE catalog_items
SET 
  is_active = true,
  target_audience = 'apprenant',
  category = COALESCE(category, 'business'),
  updated_at = NOW()
WHERE id = 'CATALOG_ITEM_ID_ICI' -- ⚠️ REMPLACEZ par l'ID trouvé dans la requête 1
  AND item_type = 'module';
*/

-- 4. Vérification finale - toutes les formations actives de Tim dans le catalogue
SELECT 
  ci.id,
  ci.title,
  ci.category,
  ci.is_active,
  ci.target_audience,
  c.title as course_title,
  c.status as course_status
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
WHERE ci.item_type = 'module'
  AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
  AND ci.is_active = true
ORDER BY ci.created_at DESC;



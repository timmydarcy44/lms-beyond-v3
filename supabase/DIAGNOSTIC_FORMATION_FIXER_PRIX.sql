-- Diagnostic pour la formation "fixer ses prix" dans la catégorie "business"
-- Vérifier si elle existe, si elle est dans le catalogue, et si elle est active

-- 1. Chercher la formation par titre
SELECT 
  id,
  title,
  status,
  creator_id,
  owner_id,
  builder_snapshot->'general'->>'assignment_type' as assignment_type,
  builder_snapshot->'general'->>'target_audience' as target_audience,
  builder_snapshot->'general'->>'category' as category,
  created_at,
  updated_at
FROM courses
WHERE title ILIKE '%fixer%prix%' OR title ILIKE '%prix%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Vérifier si elle est dans catalog_items
SELECT 
  ci.id,
  ci.content_id,
  ci.title,
  ci.category,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  ci.created_at,
  c.title as course_title,
  c.status as course_status,
  c.creator_id as course_creator_id
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
WHERE ci.item_type = 'module'
  AND (ci.title ILIKE '%fixer%prix%' OR ci.title ILIKE '%prix%' OR c.title ILIKE '%fixer%prix%' OR c.title ILIKE '%prix%')
ORDER BY ci.created_at DESC;

-- 3. Vérifier les formations de Tim (timdarcypro@gmail.com)
SELECT 
  c.id,
  c.title,
  c.status,
  c.creator_id,
  c.builder_snapshot->'general'->>'category' as category,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  ci.id as catalog_item_id,
  ci.is_active as catalog_is_active,
  ci.target_audience as catalog_target_audience
FROM courses c
LEFT JOIN catalog_items ci ON ci.content_id = c.id AND ci.item_type = 'module'
WHERE c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
ORDER BY c.created_at DESC
LIMIT 20;

-- 4. Vérifier les formations de contentin.cabinet@gmail.com
SELECT 
  p.id as user_id,
  p.email
FROM profiles p
WHERE p.email = 'contentin.cabinet@gmail.com';

-- 5. Vérifier toutes les formations actives dans le catalogue pour Tim
SELECT 
  ci.id,
  ci.title,
  ci.category,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  c.title as course_title,
  c.status as course_status
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
WHERE ci.item_type = 'module'
  AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
  AND ci.is_active = true
ORDER BY ci.created_at DESC;

-- 6. Vérifier toutes les formations actives dans le catalogue pour contentin
SELECT 
  ci.id,
  ci.title,
  ci.category,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  c.title as course_title,
  c.status as course_status
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
LEFT JOIN profiles p ON p.id = ci.creator_id
WHERE ci.item_type = 'module'
  AND p.email = 'contentin.cabinet@gmail.com'
  AND ci.is_active = true
ORDER BY ci.created_at DESC;


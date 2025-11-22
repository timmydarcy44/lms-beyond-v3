-- Diagnostic : Pourquoi les formations n'apparaissent pas dans le catalogue
-- =========================================================================

-- 1. Vérifier les formations récentes créées par le Super Admin
SELECT 
  'COURSES RÉCENTS' as type,
  c.id,
  c.title,
  c.created_at,
  c.creator_id,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as target_audience,
  c.builder_snapshot->'general'->>'category' as category,
  c.status
FROM courses c
WHERE c.creator_id = (SELECT user_id FROM super_admins WHERE is_active = true LIMIT 1)
ORDER BY c.created_at DESC
LIMIT 10;

-- 2. Vérifier les catalog_items correspondants
SELECT 
  'CATALOG ITEMS' as type,
  ci.id,
  ci.content_id,
  ci.title,
  ci.is_active,
  ci.target_audience,
  ci.category,
  ci.creator_id,
  ci.created_at
FROM catalog_items ci
WHERE ci.creator_id = (SELECT user_id FROM super_admins WHERE is_active = true LIMIT 1)
  AND ci.item_type = 'module'
ORDER BY ci.created_at DESC
LIMIT 10;

-- 3. Comparer : formations SANS catalog_item
SELECT 
  'FORMATIONS SANS CATALOG_ITEM' as type,
  c.id,
  c.title,
  c.created_at,
  c.creator_id,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as target_audience,
  c.status
FROM courses c
WHERE c.creator_id = (SELECT user_id FROM super_admins WHERE is_active = true LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM catalog_items ci 
    WHERE ci.content_id = c.id 
    AND ci.item_type = 'module'
  )
ORDER BY c.created_at DESC;

-- 4. Vérifier les catalog_items inactifs
SELECT 
  'CATALOG ITEMS INACTIFS' as type,
  ci.id,
  ci.content_id,
  ci.title,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  ci.created_at
FROM catalog_items ci
WHERE ci.creator_id = (SELECT user_id FROM super_admins WHERE is_active = true LIMIT 1)
  AND ci.item_type = 'module'
  AND ci.is_active = false
ORDER BY ci.created_at DESC;

-- 5. Vérifier les catalog_items avec target_audience incorrect
SELECT 
  'CATALOG ITEMS TARGET_AUDIENCE INCORRECT' as type,
  ci.id,
  ci.content_id,
  ci.title,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as target_audience_snapshot
FROM catalog_items ci
JOIN courses c ON c.id = ci.content_id
WHERE ci.creator_id = (SELECT user_id FROM super_admins WHERE is_active = true LIMIT 1)
  AND ci.item_type = 'module'
  AND (
    (c.builder_snapshot->'general'->>'assignment_type' = 'no_school' AND ci.target_audience != 'apprenant')
    OR (ci.is_active = false AND c.builder_snapshot->'general'->>'assignment_type' = 'no_school')
  )
ORDER BY ci.created_at DESC;




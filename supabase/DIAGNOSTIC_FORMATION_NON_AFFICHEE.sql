-- Diagnostic pour comprendre pourquoi une formation ne s'affiche pas dans Beyond No School
-- =========================================================================

-- 1. Trouver les formations récentes de Tim
SELECT 
  c.id,
  c.title,
  c.status,
  c.creator_id,
  c.builder_snapshot->'general'->>'title' as snapshot_title,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as target_audience,
  c.builder_snapshot->'general'->>'category' as category,
  c.created_at,
  c.updated_at
FROM courses c
WHERE c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
ORDER BY c.created_at DESC
LIMIT 10;

-- 2. Vérifier les catalog_items correspondants
SELECT 
  ci.id as catalog_item_id,
  ci.content_id,
  ci.title,
  ci.category,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  ci.created_by,
  ci.created_at,
  ci.updated_at,
  c.title as course_title,
  c.status as course_status,
  c.builder_snapshot->'general'->>'assignment_type' as course_assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as course_target_audience
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
WHERE ci.item_type = 'module'
  AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
ORDER BY ci.created_at DESC
LIMIT 10;

-- 3. Vérifier les formations qui DEVRAIENT être dans le catalogue mais qui n'y sont pas
SELECT 
  c.id,
  c.title,
  c.status,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type,
  c.builder_snapshot->'general'->>'target_audience' as target_audience,
  CASE 
    WHEN c.builder_snapshot->'general'->>'assignment_type' = 'no_school' THEN 'DEVRAIT être dans le catalogue'
    WHEN c.status = 'published' AND c.builder_snapshot->'general'->>'target_audience' = 'apprenant' THEN 'DEVRAIT être dans le catalogue'
    ELSE 'Ne devrait PAS être dans le catalogue'
  END as devrait_etre_dans_catalogue,
  ci.id as catalog_item_id,
  ci.is_active as catalog_is_active,
  ci.target_audience as catalog_target_audience
FROM courses c
LEFT JOIN catalog_items ci ON ci.content_id = c.id AND ci.item_type = 'module' AND ci.creator_id = c.creator_id
WHERE c.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
  AND (
    c.builder_snapshot->'general'->>'assignment_type' = 'no_school'
    OR (c.status = 'published' AND c.builder_snapshot->'general'->>'target_audience' = 'apprenant')
  )
ORDER BY c.created_at DESC;

-- 4. Vérifier les catalog_items actifs pour Beyond No School
SELECT 
  ci.id,
  ci.title,
  ci.category,
  ci.is_active,
  ci.target_audience,
  ci.creator_id,
  c.title as course_title,
  c.status as course_status,
  c.builder_snapshot->'general'->>'assignment_type' as assignment_type
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
WHERE ci.item_type = 'module'
  AND ci.creator_id = '60c88469-3c53-417f-a81d-565a662ad2f5' -- Tim
  AND ci.is_active = true
  AND ci.target_audience = 'apprenant'
ORDER BY ci.created_at DESC;



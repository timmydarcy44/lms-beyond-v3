-- Vérifier les items du catalogue et leur statut
SELECT 
  ci.id,
  ci.item_type,
  ci.title,
  ci.target_audience,
  ci.is_active,
  ci.content_id,
  ci.created_at,
  CASE 
    WHEN ci.item_type = 'module' THEN c.title
    WHEN ci.item_type = 'parcours' THEN p.title
    WHEN ci.item_type = 'ressource' THEN r.title
    WHEN ci.item_type = 'test' THEN t.title
    ELSE 'N/A'
  END as original_content_title
FROM catalog_items ci
LEFT JOIN courses c ON ci.item_type = 'module' AND ci.content_id = c.id
LEFT JOIN paths p ON ci.item_type = 'parcours' AND ci.content_id = p.id
LEFT JOIN resources r ON ci.item_type = 'ressource' AND ci.content_id = r.id
LEFT JOIN tests t ON ci.item_type = 'test' AND ci.content_id = t.id
ORDER BY ci.created_at DESC
LIMIT 20;

-- Vérifier les accès accordés
SELECT 
  ca.id,
  ca.organization_id,
  o.name as organization_name,
  ca.catalog_item_id,
  ci.title as catalog_item_title,
  ca.access_status,
  ca.granted_at
FROM catalog_access ca
JOIN organizations o ON ca.organization_id = o.id
JOIN catalog_items ci ON ca.catalog_item_id = ci.id
ORDER BY ca.created_at DESC
LIMIT 20;





-- Vérifier si une ressource existe avec l'ID donné
-- Remplacez 'a8a82d15-044a-4d99-8918-29f4ac139071' par l'ID de la ressource que vous cherchez

-- 1. Chercher dans la table resources
SELECT 
  'resources' as table_name,
  id,
  title,
  created_by,
  owner_id,
  slug
FROM resources
WHERE id = 'a8a82d15-044a-4d99-8918-29f4ac139071';

-- 2. Chercher dans catalog_items par ID
SELECT 
  'catalog_items (by id)' as table_name,
  id,
  content_id,
  item_type,
  title,
  created_by,
  creator_id,
  is_active
FROM catalog_items
WHERE id = 'a8a82d15-044a-4d99-8918-29f4ac139071';

-- 3. Chercher dans catalog_items par content_id
SELECT 
  'catalog_items (by content_id)' as table_name,
  id,
  content_id,
  item_type,
  title,
  created_by,
  creator_id,
  is_active
FROM catalog_items
WHERE content_id = 'a8a82d15-044a-4d99-8918-29f4ac139071'
  AND item_type = 'ressource';

-- 4. Lister toutes les ressources de Jessica Contentin
SELECT 
  r.id as resource_id,
  r.title as resource_title,
  ci.id as catalog_item_id,
  ci.is_active,
  ci.created_by,
  ci.creator_id
FROM resources r
LEFT JOIN catalog_items ci ON ci.content_id = r.id AND ci.item_type = 'ressource'
WHERE r.created_by = '17364229-fe78-4986-ac69-41b880e34631'
   OR r.owner_id = '17364229-fe78-4986-ac69-41b880e34631'
ORDER BY r.created_at DESC;


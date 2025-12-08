-- Vérifier si le module "Qu'est-ce que le TDAH ?" a un catalog_item associé
-- Course ID: 35386cda-1396-4ade-9ed7-f5e5184a2a6e

-- 1. Vérifier le course
SELECT 
    id,
    title,
    creator_id,
    price,
    slug
FROM courses
WHERE id = '35386cda-1396-4ade-9ed7-f5e5184a2a6e';

-- 2. Vérifier si un catalog_item existe pour ce course
SELECT 
    ci.id AS catalog_item_id,
    ci.title,
    ci.item_type,
    ci.content_id,
    ci.price,
    ci.is_free,
    ci.is_active,
    ci.created_by,
    ci.creator_id
FROM catalog_items ci
WHERE ci.content_id = '35386cda-1396-4ade-9ed7-f5e5184a2a6e'
  AND ci.item_type = 'module';

-- 3. Vérifier le profil de Jessica Contentin
SELECT 
    id,
    email,
    full_name
FROM profiles
WHERE email = 'contentin.cabinet@gmail.com';


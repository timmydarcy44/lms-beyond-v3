-- Mettre à jour le prix du Guide pratique : comprendre et résoudre les problématiques de sommeil des enfants de 3 à 11 ans
-- ============================================================================================================================
-- ID de la ressource: f2a961f4-bc0e-49cd-b683-ad65e834213b
-- ID du catalog_item: a8a82d15-044a-4d99-8918-29f4ac139071

-- 1. Mettre à jour le prix dans catalog_items
UPDATE catalog_items
SET price = 1.00
WHERE id = 'a8a82d15-044a-4d99-8918-29f4ac139071'
   OR (content_id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b' AND item_type = 'ressource');

-- 2. Mettre à jour le prix dans resources (si la colonne existe)
UPDATE resources
SET price = 1.00
WHERE id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b'
   OR title ILIKE '%Guide pratique%sommeil%enfants%3 à 11 ans%';

-- 3. Vérifier les mises à jour
SELECT 
  'catalog_items' as table_name,
  id,
  title,
  price,
  item_type,
  content_id
FROM catalog_items
WHERE id = 'a8a82d15-044a-4d99-8918-29f4ac139071'
   OR (content_id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b' AND item_type = 'ressource');

SELECT 
  'resources' as table_name,
  id,
  title,
  price
FROM resources
WHERE id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b'
   OR title ILIKE '%Guide pratique%sommeil%enfants%3 à 11 ans%';


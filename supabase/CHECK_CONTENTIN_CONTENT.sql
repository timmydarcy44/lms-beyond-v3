-- Vérifier les contenus créés par contentin.cabinet@gmail.com
-- ===========================================================

-- 1. Vérifier les courses créés par contentin.cabinet@gmail.com
SELECT 
  'COURSES DE CONTENTIN' as "Info",
  c.id,
  c.title,
  c.status,
  c.created_at,
  c.creator_id,
  p.email as creator_email
FROM courses c
JOIN profiles p ON p.id = c.creator_id
WHERE p.email = 'contentin.cabinet@gmail.com'
ORDER BY c.created_at DESC;

-- 2. Vérifier si ces courses sont dans le catalogue
SELECT 
  'COURSES DANS CATALOGUE' as "Info",
  c.id,
  c.title,
  ci.id as catalog_item_id,
  ci.item_type,
  ci.creator_id,
  CASE 
    WHEN ci.id IS NULL THEN 'Pas dans le catalogue'
    WHEN ci.creator_id IS NULL THEN 'Dans le catalogue mais creator_id manquant'
    ELSE 'Dans le catalogue avec creator_id'
  END as status
FROM courses c
JOIN profiles p ON p.id = c.creator_id
LEFT JOIN catalog_items ci ON ci.content_id = c.id
WHERE p.email = 'contentin.cabinet@gmail.com'
ORDER BY c.created_at DESC;

-- 3. Vérifier l'ID de contentin.cabinet@gmail.com
SELECT 
  'PROFILE CONTENTIN' as "Info",
  id,
  email,
  full_name,
  role
FROM profiles
WHERE email = 'contentin.cabinet@gmail.com';




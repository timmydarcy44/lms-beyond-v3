-- Vérifier l'accès d'un utilisateur à un test
-- Remplacez les valeurs ci-dessous par les vraies valeurs

-- ID de l'utilisateur (timmydarcy44@gmail.com)
-- ID du test (Soft Skills - Profil 360)
-- ID du catalog_item correspondant

-- 1. Trouver l'ID de l'utilisateur
SELECT id, email, full_name 
FROM profiles 
WHERE email = 'timmydarcy44@gmail.com';

-- 2. Trouver le catalog_item_id pour le test "Soft Skills – Profil 360"
SELECT 
  ci.id as catalog_item_id,
  ci.title,
  ci.content_id as test_id,
  ci.item_type,
  ci.creator_id,
  t.id as test_table_id,
  t.title as test_title
FROM catalog_items ci
LEFT JOIN tests t ON t.id = ci.content_id
WHERE ci.title = 'Soft Skills – Profil 360'
  OR t.title = 'Soft Skills – Profil 360'
  OR ci.content_id = '8820291a-b58f-4154-aa62-df2506c28921';

-- 3. Vérifier l'accès dans catalog_access
-- Remplacez USER_ID et CATALOG_ITEM_ID par les valeurs trouvées ci-dessus
SELECT 
  ca.*,
  p.email as user_email,
  ci.title as catalog_item_title
FROM catalog_access ca
JOIN profiles p ON p.id = ca.user_id
JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.user_id = '225f10f7-850b-4897-8ed6-637cf5ea0cd5'  -- ID de timmydarcy44@gmail.com
  AND ca.catalog_item_id = 'f03b570e-63ce-4da1-99bd-aa27de02e9e1';  -- ID du catalog_item pour Soft Skills

-- 4. Si l'accès n'existe pas, le créer manuellement
-- Décommentez et exécutez cette requête si nécessaire
/*
INSERT INTO catalog_access (
  user_id,
  catalog_item_id,
  access_status,
  granted_at
) VALUES (
  '225f10f7-850b-4897-8ed6-637cf5ea0cd5',  -- ID de timmydarcy44@gmail.com
  'f03b570e-63ce-4da1-99bd-aa27de02e9e1',  -- ID du catalog_item pour Soft Skills
  'manually_granted',
  NOW()
)
ON CONFLICT (user_id, catalog_item_id) 
DO UPDATE SET 
  access_status = 'manually_granted',
  granted_at = NOW();
*/


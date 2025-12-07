-- Vérifier les données de Jessica Contentin pour comprendre pourquoi "mon compte" est vide

-- 1. Vérifier le profil de Jessica
SELECT 
  id as profile_id,
  email,
  full_name,
  created_at
FROM profiles
WHERE email = 'contentin.cabinet@gmail.com';

-- 2. Vérifier les catalog_items créés par Jessica
SELECT 
  ci.id,
  ci.title,
  ci.item_type,
  ci.is_active,
  ci.created_by,
  ci.creator_id,
  ci.price
FROM catalog_items ci
WHERE ci.created_by = (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com')
   OR ci.creator_id = (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com')
ORDER BY ci.created_at DESC;

-- 3. Vérifier les accès dans catalog_access pour Jessica
SELECT 
  ca.id,
  ca.user_id,
  ca.catalog_item_id,
  ca.access_status,
  ca.granted_at,
  ci.title as item_title,
  ci.item_type
FROM catalog_access ca
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.user_id = (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com')
ORDER BY ca.granted_at DESC;

-- 4. Comparer user.id (auth.users) avec profile.id
SELECT 
  au.id as auth_user_id,
  p.id as profile_id,
  au.email as auth_email,
  p.email as profile_email,
  CASE 
    WHEN au.id::text = p.id::text THEN '✅ IDs correspondent'
    ELSE '❌ IDs ne correspondent PAS'
  END as id_match
FROM auth.users au
JOIN profiles p ON p.email = au.email
WHERE au.email = 'contentin.cabinet@gmail.com';

-- 5. Résumé : Nombre de contenus créés vs nombre d'accès
SELECT 
  (SELECT COUNT(*) 
   FROM catalog_items 
   WHERE created_by = (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com')
      OR creator_id = (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com')
  ) as total_items_created,
  (SELECT COUNT(*) 
   FROM catalog_access 
   WHERE user_id = (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com')
  ) as total_access_entries;


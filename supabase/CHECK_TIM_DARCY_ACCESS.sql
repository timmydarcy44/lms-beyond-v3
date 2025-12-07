-- Vérifier les accès de timmydarcy44@gmail.com

-- 1. Vérifier le profil de Timmy Darcy
SELECT 
  id as profile_id,
  email,
  full_name,
  user_id as auth_user_id,
  created_at
FROM profiles
WHERE email = 'timmydarcy44@gmail.com';

-- 2. Vérifier les accès dans catalog_access pour Timmy Darcy
SELECT 
  ca.id,
  ca.user_id,
  ca.catalog_item_id,
  ca.access_status,
  ca.granted_at,
  ca.purchase_amount,
  ca.purchase_date,
  ci.title as item_title,
  ci.item_type,
  ci.created_by as creator_id
FROM catalog_access ca
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.user_id = (SELECT user_id FROM profiles WHERE email = 'timmydarcy44@gmail.com')
ORDER BY ca.granted_at DESC;

-- 3. Vérifier si les catalog_items existent toujours
SELECT 
  ci.id,
  ci.title,
  ci.item_type,
  ci.is_active,
  ci.created_by,
  ci.creator_id
FROM catalog_items ci
WHERE ci.id IN (
  SELECT catalog_item_id 
  FROM catalog_access 
  WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'timmydarcy44@gmail.com')
);

-- 4. Comparer user_id (auth.users) avec user_id dans catalog_access
SELECT 
  au.id as auth_user_id,
  p.id as profile_id,
  p.user_id as profile_user_id,
  au.email as auth_email,
  p.email as profile_email,
  CASE 
    WHEN au.id::text = p.user_id::text THEN '✅ IDs correspondent'
    ELSE '❌ IDs ne correspondent PAS'
  END as id_match
FROM auth.users au
JOIN profiles p ON p.email = au.email
WHERE au.email = 'timmydarcy44@gmail.com';

-- 5. Résumé : Nombre d'accès pour Timmy Darcy
SELECT 
  COUNT(*) as total_access_entries,
  COUNT(DISTINCT catalog_item_id) as unique_items,
  SUM(CASE WHEN access_status = 'purchased' THEN 1 ELSE 0 END) as purchased_count,
  SUM(CASE WHEN access_status = 'manually_granted' THEN 1 ELSE 0 END) as manually_granted_count,
  SUM(CASE WHEN access_status = 'free' THEN 1 ELSE 0 END) as free_count
FROM catalog_access
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'timmydarcy44@gmail.com');


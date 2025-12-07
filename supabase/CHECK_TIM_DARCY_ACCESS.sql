-- Vérifier les accès de timmydarcy44@gmail.com

-- 1. Vérifier le profil de Timmy Darcy
-- Note: profiles.id correspond à auth.users.id dans Supabase
SELECT 
  id as profile_id,
  id as auth_user_id, -- profiles.id = auth.users.id
  email,
  full_name,
  created_at
FROM profiles
WHERE email = 'timmydarcy44@gmail.com';

-- 2. Vérifier les accès dans catalog_access pour Timmy Darcy
-- Note: catalog_access.user_id correspond à profiles.id (qui est aussi auth.users.id)
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
WHERE ca.user_id = (SELECT id FROM profiles WHERE email = 'timmydarcy44@gmail.com')
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
  WHERE user_id = (SELECT id FROM profiles WHERE email = 'timmydarcy44@gmail.com')
);

-- 4. Comparer auth.users.id avec profiles.id (ils doivent être identiques)
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
JOIN profiles p ON p.id = au.id -- profiles.id = auth.users.id
WHERE au.email = 'timmydarcy44@gmail.com';

-- 5. Résumé : Nombre d'accès pour Timmy Darcy
SELECT 
  COUNT(*) as total_access_entries,
  COUNT(DISTINCT catalog_item_id) as unique_items,
  SUM(CASE WHEN access_status = 'purchased' THEN 1 ELSE 0 END) as purchased_count,
  SUM(CASE WHEN access_status = 'manually_granted' THEN 1 ELSE 0 END) as manually_granted_count,
  SUM(CASE WHEN access_status = 'free' THEN 1 ELSE 0 END) as free_count
FROM catalog_access
WHERE user_id = (SELECT id FROM profiles WHERE email = 'timmydarcy44@gmail.com');


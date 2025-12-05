-- Script pour vérifier les accès de Dany (paindany36@gmail.com) aux contenus de Jessica Contentin
-- ============================================================================

-- 1. Trouver l'ID de Dany
SELECT 
  id as dany_user_id,
  email,
  full_name
FROM public.profiles
WHERE email = 'paindany36@gmail.com';

-- 2. Trouver l'ID de Jessica Contentin
SELECT 
  id as jessica_profile_id,
  email
FROM public.profiles
WHERE email = 'contentin.cabinet@gmail.com';

-- 3. Vérifier les accès de Dany dans catalog_access
SELECT 
  ca.id as access_id,
  ca.user_id,
  ca.catalog_item_id,
  ca.access_status,
  ca.granted_at,
  ca.granted_by,
  ci.id as catalog_item_id_check,
  ci.title,
  ci.item_type,
  ci.creator_id,
  ci.content_id
FROM public.catalog_access ca
JOIN public.catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.user_id = (
  SELECT id FROM public.profiles WHERE email = 'paindany36@gmail.com'
)
ORDER BY ca.granted_at DESC;

-- 4. Vérifier les accès de Dany pour les contenus de Jessica uniquement
SELECT 
  ca.id as access_id,
  ca.user_id,
  ca.catalog_item_id,
  ca.access_status,
  ca.granted_at,
  ci.title,
  ci.item_type,
  ci.creator_id,
  p.email as creator_email
FROM public.catalog_access ca
JOIN public.catalog_items ci ON ci.id = ca.catalog_item_id
JOIN public.profiles p ON p.id = ci.creator_id
WHERE ca.user_id = (
  SELECT id FROM public.profiles WHERE email = 'paindany36@gmail.com'
)
AND ci.creator_id = (
  SELECT id FROM public.profiles WHERE email = 'contentin.cabinet@gmail.com'
)
ORDER BY ca.granted_at DESC;

-- 5. Compter les accès par statut
SELECT 
  ca.access_status,
  COUNT(*) as count
FROM public.catalog_access ca
JOIN public.catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.user_id = (
  SELECT id FROM public.profiles WHERE email = 'paindany36@gmail.com'
)
AND ci.creator_id = (
  SELECT id FROM public.profiles WHERE email = 'contentin.cabinet@gmail.com'
)
GROUP BY ca.access_status;


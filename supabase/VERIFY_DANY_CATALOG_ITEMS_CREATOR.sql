-- Script pour vérifier que les catalog_items de Dany ont bien le bon creator_id
-- ============================================================================

-- 1. Vérifier les accès de Dany avec les creator_id des catalog_items
SELECT 
  ca.id as access_id,
  ca.user_id,
  ca.catalog_item_id,
  ca.access_status,
  ci.title,
  ci.creator_id,
  p_creator.email as creator_email,
  p_dany.email as dany_email
FROM public.catalog_access ca
JOIN public.catalog_items ci ON ci.id = ca.catalog_item_id
JOIN public.profiles p_dany ON p_dany.id = ca.user_id
LEFT JOIN public.profiles p_creator ON p_creator.id = ci.creator_id
WHERE p_dany.email = 'paindany36@gmail.com'
ORDER BY ca.granted_at DESC;

-- 2. Vérifier l'ID de Jessica Contentin
SELECT 
  id as jessica_profile_id,
  email
FROM public.profiles
WHERE email = 'contentin.cabinet@gmail.com';

-- 3. Vérifier si les catalog_items ont le bon creator_id (Jessica)
SELECT 
  ci.id,
  ci.title,
  ci.creator_id,
  p.email as creator_email,
  CASE 
    WHEN p.email = 'contentin.cabinet@gmail.com' THEN '✅ Correct'
    ELSE '❌ Incorrect'
  END as status
FROM public.catalog_items ci
JOIN public.catalog_access ca ON ca.catalog_item_id = ci.id
JOIN public.profiles p ON p.id = ci.creator_id
JOIN public.profiles p_dany ON p_dany.id = ca.user_id
WHERE p_dany.email = 'paindany36@gmail.com'
ORDER BY ca.granted_at DESC;


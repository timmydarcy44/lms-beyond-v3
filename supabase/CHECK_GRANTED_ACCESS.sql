-- Script pour vérifier les accès accordés manuellement
-- =====================================================
-- Ce script permet de vérifier si les accès accordés manuellement sont bien présents
-- et s'ils sont correctement liés aux catalog_items de Jessica Contentin

-- 1. Voir tous les accès accordés manuellement pour un utilisateur spécifique
-- Remplacez 'USER_EMAIL' par l'email de l'utilisateur
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  p.full_name as user_name,
  ca.catalog_item_id,
  ci.title as item_title,
  ci.item_type,
  ci.price,
  ci.created_by,
  ci.creator_id,
  jessica.id as jessica_id,
  CASE 
    WHEN ci.created_by = jessica.id OR ci.creator_id = jessica.id THEN 'OUI'
    ELSE 'NON'
  END as is_jessica_item,
  ca.access_status,
  ca.granted_at,
  ca.purchase_date,
  ca.purchase_amount,
  ca.transaction_id
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
CROSS JOIN (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com') jessica
WHERE p.email = 'contentin.cabinet@gmail.com'  -- Remplacez par l'email de l'utilisateur
  AND ca.access_status IN ('purchased', 'manually_granted', 'free')
ORDER BY ca.granted_at DESC;

-- 2. Vérifier les accès pour tous les utilisateurs (Jessica Contentin uniquement)
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  p.full_name as user_name,
  ca.catalog_item_id,
  ci.title as item_title,
  ci.item_type,
  ci.price,
  ci.created_by,
  ci.creator_id,
  jessica.id as jessica_id,
  CASE 
    WHEN ci.created_by = jessica.id OR ci.creator_id = jessica.id THEN 'OUI'
    ELSE 'NON'
  END as is_jessica_item,
  ca.access_status,
  ca.granted_at,
  ca.purchase_date
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
CROSS JOIN (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com') jessica
WHERE (ci.created_by = jessica.id OR ci.creator_id = jessica.id)
  AND ca.access_status IN ('purchased', 'manually_granted', 'free')
  AND ca.user_id IS NOT NULL  -- Accès B2C uniquement
ORDER BY ca.granted_at DESC
LIMIT 50;

-- 3. Vérifier les accès récents (dernières 24h)
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  ca.catalog_item_id,
  ci.title as item_title,
  ci.item_type,
  ca.access_status,
  ca.granted_at,
  ci.created_by,
  ci.creator_id
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.created_at >= NOW() - INTERVAL '24 hours'
  AND ca.user_id IS NOT NULL
ORDER BY ca.created_at DESC;

-- 4. Vérifier si les catalog_items ont bien created_by ou creator_id = Jessica
SELECT 
  ci.id,
  ci.title,
  ci.item_type,
  ci.created_by,
  ci.creator_id,
  jessica.id as jessica_id,
  CASE 
    WHEN ci.created_by = jessica.id OR ci.creator_id = jessica.id THEN 'OUI'
    ELSE 'NON'
  END as is_jessica_item
FROM catalog_items ci
CROSS JOIN (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com') jessica
WHERE ci.is_active = true
ORDER BY ci.created_at DESC;


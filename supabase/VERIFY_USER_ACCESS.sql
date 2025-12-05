-- Script pour vérifier les accès utilisateur accordés manuellement
-- =================================================================
-- Ce script permet de vérifier si les accès accordés manuellement sont bien présents
-- et s'ils sont correctement liés aux utilisateurs (B2C) et non aux organisations (B2B)

-- 1. Voir tous les accès accordés manuellement (B2C uniquement - avec user_id)
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  p.full_name as user_name,
  ca.organization_id,
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
  ca.granted_by,
  ca.grant_reason,
  ca.purchase_date,
  ca.purchase_amount
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
CROSS JOIN (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com') jessica
WHERE ca.user_id IS NOT NULL  -- Accès B2C uniquement
  AND ca.organization_id IS NULL  -- Pas d'organisation
  AND ca.access_status IN ('purchased', 'manually_granted', 'free')
ORDER BY ca.granted_at DESC
LIMIT 50;

-- 2. Vérifier les accès pour un utilisateur spécifique (remplacez l'email)
-- Remplacez 'USER_EMAIL' par l'email de l'utilisateur
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  p.full_name as user_name,
  ca.organization_id,
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
  ca.granted_by,
  ca.grant_reason
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
CROSS JOIN (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com') jessica
WHERE p.email = 'USER_EMAIL'  -- Remplacez par l'email de l'utilisateur
  AND ca.user_id IS NOT NULL
  AND ca.organization_id IS NULL
  AND ca.access_status IN ('purchased', 'manually_granted', 'free')
ORDER BY ca.granted_at DESC;

-- 3. Vérifier s'il y a des accès avec organization_id au lieu de user_id (erreur)
SELECT 
  ca.id,
  ca.user_id,
  ca.organization_id,
  p.email as user_email,
  o.name as org_name,
  ci.title as item_title,
  ca.access_status,
  ca.granted_at
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN organizations o ON o.id = ca.organization_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.access_status IN ('purchased', 'manually_granted', 'free')
  AND (
    (ca.user_id IS NOT NULL AND ca.organization_id IS NOT NULL) OR  -- Les deux présents (erreur)
    (ca.user_id IS NULL AND ca.organization_id IS NOT NULL)  -- Seulement organization_id (B2B)
  )
ORDER BY ca.granted_at DESC
LIMIT 20;

-- 4. Compter les accès par type
SELECT 
  CASE 
    WHEN user_id IS NOT NULL AND organization_id IS NULL THEN 'B2C (user_id)'
    WHEN user_id IS NULL AND organization_id IS NOT NULL THEN 'B2B (organization_id)'
    WHEN user_id IS NOT NULL AND organization_id IS NOT NULL THEN 'ERREUR (les deux)'
    ELSE 'ERREUR (aucun)'
  END as access_type,
  access_status,
  COUNT(*) as count
FROM catalog_access
WHERE access_status IN ('purchased', 'manually_granted', 'free')
GROUP BY 
  CASE 
    WHEN user_id IS NOT NULL AND organization_id IS NULL THEN 'B2C (user_id)'
    WHEN user_id IS NULL AND organization_id IS NOT NULL THEN 'B2B (organization_id)'
    WHEN user_id IS NOT NULL AND organization_id IS NOT NULL THEN 'ERREUR (les deux)'
    ELSE 'ERREUR (aucun)'
  END,
  access_status
ORDER BY access_type, access_status;

-- 5. Vérifier les accès récents (dernières 24h) pour Jessica Contentin
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
CROSS JOIN (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com') jessica
WHERE ca.created_at >= NOW() - INTERVAL '24 hours'
  AND ca.user_id IS NOT NULL
  AND ca.organization_id IS NULL
  AND (ci.created_by = jessica.id OR ci.creator_id = jessica.id)
ORDER BY ca.created_at DESC;


-- Script pour vérifier les achats Stripe et les accès dans Supabase
-- ===================================================================
-- Ce script permet de :
-- 1. Voir tous les accès accordés dans catalog_access
-- 2. Vérifier les achats par utilisateur
-- 3. Identifier les achats sans accès correspondant
-- 4. Vérifier les métadonnées Stripe

-- 1. Voir tous les accès accordés (purchased, manually_granted, free)
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  p.full_name as user_name,
  ca.catalog_item_id,
  ci.title as item_title,
  ci.item_type,
  ci.price,
  ca.access_status,
  ca.granted_at,
  ca.purchase_date,
  ca.purchase_amount,
  ca.transaction_id,
  ca.created_at
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.access_status IN ('purchased', 'manually_granted', 'free')
ORDER BY ca.purchase_date DESC NULLS LAST, ca.granted_at DESC
LIMIT 50;

-- 2. Voir les achats par utilisateur (résumé)
SELECT 
  p.email as user_email,
  p.full_name as user_name,
  COUNT(*) as total_purchases,
  SUM(ca.purchase_amount) as total_spent,
  MIN(ca.purchase_date) as first_purchase,
  MAX(ca.purchase_date) as last_purchase
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
WHERE ca.access_status = 'purchased'
  AND ca.purchase_amount > 0
GROUP BY p.id, p.email, p.full_name
ORDER BY total_spent DESC;

-- 3. Voir les accès pour un utilisateur spécifique (remplacer l'email)
-- Exemple pour contentin.cabinet@gmail.com
SELECT 
  ca.id,
  ca.catalog_item_id,
  ci.title as item_title,
  ci.item_type,
  ci.price,
  ca.access_status,
  ca.granted_at,
  ca.purchase_date,
  ca.purchase_amount,
  ca.transaction_id
FROM catalog_access ca
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
LEFT JOIN profiles p ON p.id = ca.user_id
WHERE p.email = 'contentin.cabinet@gmail.com'
  AND ca.access_status IN ('purchased', 'manually_granted', 'free')
ORDER BY ca.purchase_date DESC NULLS LAST, ca.granted_at DESC;

-- 4. Vérifier les catalog_items avec leurs prix et créateurs
SELECT 
  ci.id,
  ci.title,
  ci.item_type,
  ci.price,
  ci.is_free,
  ci.is_active,
  ci.created_by,
  p.email as creator_email,
  ci.created_at
FROM catalog_items ci
LEFT JOIN profiles p ON p.id = ci.created_by
WHERE ci.is_active = true
ORDER BY ci.created_at DESC
LIMIT 50;

-- 5. Vérifier les accès manquants (catalog_items payants sans accès pour un utilisateur)
-- Remplacez 'USER_EMAIL' par l'email de l'utilisateur
-- Remplacez 'CREATOR_EMAIL' par l'email du créateur (ex: contentin.cabinet@gmail.com)
SELECT 
  ci.id as catalog_item_id,
  ci.title,
  ci.item_type,
  ci.price,
  p.email as user_email,
  p.full_name as user_name
FROM catalog_items ci
CROSS JOIN profiles p
WHERE p.email = 'contentin.cabinet@gmail.com'  -- Email de l'utilisateur
  AND ci.created_by = (SELECT id FROM profiles WHERE email = 'contentin.cabinet@gmail.com')  -- Email du créateur
  AND ci.is_active = true
  AND ci.price > 0
  AND NOT EXISTS (
    SELECT 1 
    FROM catalog_access ca 
    WHERE ca.catalog_item_id = ci.id 
      AND ca.user_id = p.id
      AND ca.access_status IN ('purchased', 'manually_granted', 'free')
  )
ORDER BY ci.price DESC;

-- 6. Statistiques globales des achats
SELECT 
  COUNT(*) as total_access_granted,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT catalog_item_id) as unique_items,
  SUM(purchase_amount) as total_revenue,
  AVG(purchase_amount) as average_purchase,
  MIN(purchase_date) as first_purchase_date,
  MAX(purchase_date) as last_purchase_date
FROM catalog_access
WHERE access_status = 'purchased'
  AND purchase_amount > 0;

-- 7. Voir les transactions Stripe (transaction_id)
SELECT 
  ca.transaction_id,
  ca.user_id,
  p.email as user_email,
  ca.catalog_item_id,
  ci.title as item_title,
  ca.purchase_amount,
  ca.purchase_date,
  ca.granted_at
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.transaction_id IS NOT NULL
  AND ca.access_status = 'purchased'
ORDER BY ca.purchase_date DESC
LIMIT 50;

-- 8. DIAGNOSTIC : Voir TOUS les accès (tous statuts) pour comprendre ce qui se passe
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  p.full_name as user_name,
  ca.catalog_item_id,
  ci.title as item_title,
  ci.item_type,
  ci.price,
  ca.access_status,
  ca.granted_at,
  ca.purchase_date,
  ca.purchase_amount,
  ca.transaction_id,
  ca.created_at,
  ca.updated_at
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
ORDER BY ca.created_at DESC
LIMIT 100;

-- 9. DIAGNOSTIC : Vérifier si la table catalog_access existe et sa structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'catalog_access'
ORDER BY ordinal_position;

-- 10. DIAGNOSTIC : Vérifier les accès récents (dernières 24h)
SELECT 
  ca.id,
  ca.user_id,
  p.email as user_email,
  ca.catalog_item_id,
  ci.title as item_title,
  ca.access_status,
  ca.granted_at,
  ca.purchase_date,
  ca.transaction_id,
  ca.created_at
FROM catalog_access ca
LEFT JOIN profiles p ON p.id = ca.user_id
LEFT JOIN catalog_items ci ON ci.id = ca.catalog_item_id
WHERE ca.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY ca.created_at DESC;


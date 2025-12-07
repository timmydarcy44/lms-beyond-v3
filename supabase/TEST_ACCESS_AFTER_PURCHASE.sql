-- Script de test pour vérifier qu'un utilisateur a bien accès à une ressource après un achat
-- 
-- Usage:
-- 1. Remplacez 'user@example.com' par l'email de l'utilisateur à tester
-- 2. Remplacez 'catalog-item-id-here' par l'ID du catalog_item à vérifier
-- 3. Exécutez le script dans Supabase SQL Editor

-- Variables (à modifier)
\set user_email 'user@example.com'
\set catalog_item_id 'catalog-item-id-here'

-- 1. Trouver l'utilisateur
SELECT 
  '1. Utilisateur' as step,
  id as user_id,
  email,
  full_name
FROM profiles
WHERE email = :'user_email';

-- 2. Vérifier le catalog_item
SELECT 
  '2. Catalog Item' as step,
  id as catalog_item_id,
  title,
  item_type,
  content_id,
  price,
  is_free,
  created_by
FROM catalog_items
WHERE id = :'catalog_item_id';

-- 3. Vérifier l'accès dans catalog_access
SELECT 
  '3. Accès' as step,
  ca.id as access_id,
  ca.user_id,
  ca.catalog_item_id,
  ca.access_status,
  ca.granted_at,
  ca.purchase_amount,
  ca.purchase_date,
  ca.transaction_id,
  ca.organization_id
FROM catalog_access ca
JOIN profiles p ON ca.user_id = p.id
WHERE p.email = :'user_email'
  AND ca.catalog_item_id = :'catalog_item_id';

-- 4. Vérifier les sessions Stripe récentes pour cet utilisateur
SELECT 
  '4. Sessions Stripe récentes' as step,
  ca.transaction_id,
  ca.purchase_date,
  ca.purchase_amount,
  ca.access_status
FROM catalog_access ca
JOIN profiles p ON ca.user_id = p.id
WHERE p.email = :'user_email'
  AND ca.catalog_item_id = :'catalog_item_id'
  AND ca.transaction_id IS NOT NULL
ORDER BY ca.purchase_date DESC
LIMIT 5;

-- 5. Résumé de tous les accès de l'utilisateur
SELECT 
  '5. Tous les accès de l''utilisateur' as step,
  COUNT(*) as total_accesses,
  COUNT(CASE WHEN access_status = 'purchased' THEN 1 END) as purchased_count,
  COUNT(CASE WHEN access_status = 'manually_granted' THEN 1 END) as manually_granted_count,
  COUNT(CASE WHEN access_status = 'free' THEN 1 END) as free_count,
  SUM(purchase_amount) as total_spent
FROM catalog_access ca
JOIN profiles p ON ca.user_id = p.id
WHERE p.email = :'user_email';

-- 6. Vérifier si l'utilisateur est le créateur de la ressource
SELECT 
  '6. Vérification créateur' as step,
  CASE 
    WHEN ci.created_by = p.id THEN 'Oui, l''utilisateur est le créateur'
    ELSE 'Non, l''utilisateur n''est pas le créateur'
  END as is_creator,
  ci.created_by as catalog_item_creator_id,
  p.id as user_id
FROM catalog_items ci
CROSS JOIN profiles p
WHERE ci.id = :'catalog_item_id'
  AND p.email = :'user_email';

-- 7. Conclusion : L'utilisateur a-t-il accès ?
SELECT 
  '7. CONCLUSION' as step,
  CASE 
    WHEN ci.is_free = true THEN '✅ ACCÈS GRATUIT - La ressource est gratuite'
    WHEN ci.created_by = p.id THEN '✅ ACCÈS CRÉATEUR - L''utilisateur est le créateur'
    WHEN ca.access_status IN ('purchased', 'manually_granted', 'free') THEN 
      CONCAT('✅ ACCÈS AUTORISÉ - Statut: ', ca.access_status, 
             CASE 
               WHEN ca.purchase_date IS NOT NULL THEN CONCAT(' (Acheté le: ', ca.purchase_date::text, ')')
               ELSE ''
             END)
    ELSE '❌ AUCUN ACCÈS - L''utilisateur n''a pas accès à cette ressource'
  END as access_status,
  CASE 
    WHEN ci.is_free = true OR ci.created_by = p.id OR ca.access_status IN ('purchased', 'manually_granted', 'free') 
    THEN true 
    ELSE false 
  END as has_access
FROM catalog_items ci
CROSS JOIN profiles p
LEFT JOIN catalog_access ca ON ca.user_id = p.id AND ca.catalog_item_id = ci.id
WHERE ci.id = :'catalog_item_id'
  AND p.email = :'user_email';


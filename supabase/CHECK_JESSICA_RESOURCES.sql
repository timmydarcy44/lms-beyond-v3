-- Script pour vérifier les ressources de Jessica Contentin dans la base de données

-- 1. Trouver l'ID de Jessica Contentin
SELECT 
    id,
    email,
    full_name,
    role
FROM profiles
WHERE email = 'contentin.cabinet@gmail.com';

-- 2. Vérifier les catalog_items de Jessica Contentin
SELECT 
    ci.id,
    ci.title,
    ci.item_type,
    ci.is_active,
    ci.target_audience,
    ci.creator_id,
    ci.price,
    ci.is_free,
    ci.category,
    ci.created_at
FROM catalog_items ci
INNER JOIN profiles p ON p.id = ci.creator_id
WHERE p.email = 'contentin.cabinet@gmail.com'
ORDER BY ci.created_at DESC;

-- 3. Compter les ressources par type
SELECT 
    ci.item_type,
    COUNT(*) as count,
    COUNT(CASE WHEN ci.is_active = true THEN 1 END) as active_count
FROM catalog_items ci
INNER JOIN profiles p ON p.id = ci.creator_id
WHERE p.email = 'contentin.cabinet@gmail.com'
GROUP BY ci.item_type;

-- 4. Vérifier les ressources actives avec target_audience
SELECT 
    ci.id,
    ci.title,
    ci.item_type,
    ci.is_active,
    ci.target_audience,
    ci.creator_id
FROM catalog_items ci
INNER JOIN profiles p ON p.id = ci.creator_id
WHERE p.email = 'contentin.cabinet@gmail.com'
  AND ci.is_active = true
ORDER BY ci.created_at DESC;


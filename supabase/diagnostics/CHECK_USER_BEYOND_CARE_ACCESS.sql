-- Script de vérification : j.contentin@laposte.net a-t-il accès à Beyond Care ?
-- Ce script vérifie si l'utilisateur appartient à une organisation ayant activé Beyond Care

-- 1. Récupérer l'ID de l'utilisateur
WITH user_info AS (
  SELECT 
    id as user_id,
    email
  FROM auth.users
  WHERE email = 'j.contentin@laposte.net'
),
-- 2. Récupérer les organisations de l'utilisateur
user_orgs AS (
  SELECT 
    om.org_id,
    om.role,
    o.name as org_name
  FROM org_memberships om
  JOIN user_info ui ON ui.user_id = om.user_id
  JOIN organizations o ON o.id = om.org_id
),
-- 3. Vérifier si ces organisations ont Beyond Care activé
org_features AS (
  SELECT 
    uo.org_id,
    uo.org_name,
    uo.role,
    of.feature_key,
    of.is_enabled,
    of.enabled_at,
    of.expires_at
  FROM user_orgs uo
  LEFT JOIN organization_features of ON of.org_id = uo.org_id
    AND of.feature_key = 'beyond_care'
    AND of.is_enabled = true
)
-- 4. Résultat final
SELECT 
  'User Info' as check_type,
  ui.email,
  ui.user_id
FROM user_info ui

UNION ALL

SELECT 
  'Organization Membership' as check_type,
  uo.org_name as email,
  uo.org_id::text as user_id
FROM user_orgs uo

UNION ALL

SELECT 
  'Beyond Care Status' as check_type,
  CASE 
    WHEN of.is_enabled = true THEN CONCAT('✅ ACTIVÉ pour ', of.org_name)
    WHEN of.org_id IS NOT NULL THEN CONCAT('❌ DÉSACTIVÉ pour ', of.org_name)
    ELSE CONCAT('❌ NON CONFIGURÉ pour ', of.org_name)
  END as email,
  of.org_id::text as user_id
FROM org_features of

UNION ALL

-- 5. Test avec la fonction RPC has_feature
SELECT 
  'RPC Function Test' as check_type,
  CASE 
    WHEN has_feature(uo.org_id, 'beyond_care') = true 
      THEN CONCAT('✅ RPC confirme accès pour ', uo.org_name)
    ELSE CONCAT('❌ RPC indique PAS d''accès pour ', uo.org_name)
  END as email,
  uo.org_id::text as user_id
FROM user_orgs uo

UNION ALL

-- 6. Résultat global
SELECT 
  'FINAL RESULT' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM org_features 
      WHERE is_enabled = true
    ) THEN '✅ L''utilisateur A ACCÈS à Beyond Care'
    ELSE '❌ L''utilisateur N''A PAS accès à Beyond Care'
  END as email,
  '' as user_id;

-- 7. Détails supplémentaires : toutes les fonctionnalités de l'organisation
SELECT 
  'All Organization Features' as check_type,
  o.name as org_name,
  of.feature_key,
  of.is_enabled,
  of.enabled_at
FROM org_memberships om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.org_id
LEFT JOIN organization_features of ON of.org_id = o.id
WHERE u.email = 'j.contentin@laposte.net'
ORDER BY o.name, of.feature_key;


-- Script de vérification pour Beyond Care
-- Exécutez ce script pour vérifier que tout est correctement configuré

-- 1. Vérifier que la fonctionnalité existe dans organization_features
SELECT 
  'Feature Status' as check_type,
  org_id,
  feature_key,
  is_enabled,
  enabled_at,
  expires_at
FROM organization_features
WHERE feature_key = 'beyond_care';

-- 2. Vérifier que l'utilisateur j.contentin@laposte.net est membre d'une organisation
SELECT 
  'User Membership' as check_type,
  om.user_id,
  om.org_id,
  om.role,
  o.name as org_name,
  u.email
FROM org_memberships om
JOIN organizations o ON o.id = om.org_id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'j.contentin@laposte.net';

-- 3. Vérifier que la fonction has_feature fonctionne
SELECT 
  'RPC Function Test' as check_type,
  has_feature(
    (SELECT org_id FROM org_memberships om
     JOIN auth.users u ON u.id = om.user_id
     WHERE u.email = 'j.contentin@laposte.net'
     LIMIT 1),
    'beyond_care'
  ) as has_access;

-- 4. Vérifier les politiques RLS
SELECT 
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'organization_features';

-- 5. Test direct de la requête (devrait fonctionner après le fix RLS)
SELECT 
  'Direct Query Test' as check_type,
  of.*
FROM organization_features of
JOIN org_memberships om ON om.org_id = of.org_id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'j.contentin@laposte.net'
  AND of.feature_key = 'beyond_care'
  AND of.is_enabled = true;

-- 6. Vérification complète de l'accès utilisateur
-- Voir aussi : supabase/CHECK_USER_BEYOND_CARE_ACCESS.sql pour une vérification détaillée


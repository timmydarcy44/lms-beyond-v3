-- Script simplifié : Vérifier si j.contentin@laposte.net a accès à Beyond Care
-- Exécutez ce script dans Supabase SQL Editor

-- Résultat principal : OUI ou NON
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM organization_features of
      JOIN org_memberships om ON om.org_id = of.org_id
      JOIN auth.users u ON u.id = om.user_id
      WHERE u.email = 'j.contentin@laposte.net'
        AND of.feature_key = 'beyond_care'
        AND of.is_enabled = true
        AND (of.expires_at IS NULL OR of.expires_at > now())
    ) 
    THEN '✅ OUI - L''utilisateur a accès à Beyond Care'
    ELSE '❌ NON - L''utilisateur n''a PAS accès à Beyond Care'
  END as result;

-- Détails : Organisation et statut
SELECT 
  u.email,
  o.name as organisation,
  om.role as role_utilisateur,
  of.feature_key,
  of.is_enabled,
  of.enabled_at,
  of.expires_at,
  CASE 
    WHEN of.is_enabled = true AND (of.expires_at IS NULL OR of.expires_at > now())
      THEN '✅ Accès actif'
    WHEN of.is_enabled = true AND of.expires_at <= now()
      THEN '⚠️ Accès expiré'
    WHEN of.is_enabled = false
      THEN '❌ Accès désactivé'
    ELSE '❌ Fonctionnalité non configurée'
  END as statut
FROM auth.users u
JOIN org_memberships om ON om.user_id = u.id
JOIN organizations o ON o.id = om.org_id
LEFT JOIN organization_features of ON of.org_id = o.id 
  AND of.feature_key = 'beyond_care'
WHERE u.email = 'j.contentin@laposte.net';



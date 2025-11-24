-- Script pour retirer j.contentin@laposte.net de l'organisation "Centre Jessica"
-- ATTENTION : Ce script supprime l'appartenance à l'organisation

-- 1. Vérifier l'appartenance actuelle
SELECT 
  u.email,
  o.name as organisation,
  om.role,
  om.org_id
FROM org_memberships om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.org_id
WHERE u.email = 'j.contentin@laposte.net';

-- 2. Retirer l'utilisateur de "Centre Jessica"
DELETE FROM org_memberships
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net'
)
AND org_id = (
  SELECT id FROM organizations WHERE name = 'Centre Jessica'
);

-- 3. Vérifier le résultat
SELECT 
  u.email,
  o.name as organisation,
  om.role
FROM org_memberships om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.org_id
WHERE u.email = 'j.contentin@laposte.net';









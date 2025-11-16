-- Script pour mettre à jour timmydarcy44@gmail.com en admin
-- Cet utilisateur doit être admin (pas juste instructor) pour accéder à Beyond Care

-- 1. Vérifier le rôle actuel
SELECT 
  u.email,
  p.role as profile_role,
  om.role as org_membership_role,
  o.name as organisation
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN org_memberships om ON om.user_id = u.id
LEFT JOIN organizations o ON o.id = om.org_id
WHERE u.email = 'timmydarcy44@gmail.com';

-- 2. Mettre à jour le rôle dans org_memberships en admin
UPDATE org_memberships
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'timmydarcy44@gmail.com'
)
AND org_id IN (
  SELECT id FROM organizations 
  WHERE name LIKE '%Jessica%' OR name LIKE '%Contentin%'
);

-- 3. Vérifier le résultat
SELECT 
  u.email,
  p.role as profile_role,
  om.role as org_membership_role,
  o.name as organisation
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN org_memberships om ON om.user_id = u.id
LEFT JOIN organizations o ON o.id = om.org_id
WHERE u.email = 'timmydarcy44@gmail.com';




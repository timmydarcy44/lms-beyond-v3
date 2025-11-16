-- Corriger le rôle de contentin.cabinet@gmail.com pour super_admin
-- =================================================================

-- 1. Vérifier le rôle actuel
SELECT 
  'ROLE ACTUEL' as "Info",
  id,
  email,
  role,
  full_name
FROM profiles
WHERE email = 'contentin.cabinet@gmail.com';

-- 2. Mettre à jour le rôle à super_admin
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'contentin.cabinet@gmail.com'
  AND role != 'super_admin';

-- 3. Vérifier que l'utilisateur est dans la table super_admins
INSERT INTO super_admins (user_id, is_active, created_at)
SELECT 
  p.id,
  true,
  NOW()
FROM profiles p
WHERE p.email = 'contentin.cabinet@gmail.com'
  AND p.role = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM super_admins sa WHERE sa.user_id = p.id
  );

-- 4. Vérifier le résultat final
SELECT 
  'VERIFICATION FINALE' as "Info",
  p.id,
  p.email,
  p.role,
  sa.user_id IS NOT NULL as is_in_super_admins,
  sa.is_active,
  CASE 
    WHEN p.role = 'super_admin' AND sa.is_active = true THEN 'SUPER ADMIN VALIDE ✓'
    WHEN p.role = 'super_admin' AND (sa.is_active = false OR sa.user_id IS NULL) THEN 'ROLE SUPER_ADMIN MAIS INACTIF OU MANQUANT DANS SUPER_ADMINS'
    ELSE 'PROBLEME'
  END as status
FROM profiles p
LEFT JOIN super_admins sa ON p.id = sa.user_id
WHERE p.email = 'contentin.cabinet@gmail.com';


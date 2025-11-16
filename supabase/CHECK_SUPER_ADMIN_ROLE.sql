-- Vérifier le rôle de l'utilisateur actuel et son statut Super Admin
-- =================================================================

-- 1. Vérifier les profils avec rôle super_admin
SELECT 
  'PROFILES AVEC ROLE SUPER_ADMIN' as "Info",
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles
WHERE role = 'super_admin'
ORDER BY created_at DESC;

-- 2. Vérifier la table super_admins
SELECT 
  'SUPER_ADMINS TABLE' as "Info",
  sa.user_id,
  p.email,
  p.role as profile_role,
  sa.is_active,
  sa.created_at
FROM super_admins sa
JOIN profiles p ON sa.user_id = p.id
ORDER BY sa.created_at DESC;

-- 3. Vérifier si contentin.cabinet@gmail.com est super admin
SELECT 
  'CHECK CONTENTIN.CABINET' as "Info",
  p.id,
  p.email,
  p.role,
  sa.user_id IS NOT NULL as is_in_super_admins,
  sa.is_active,
  CASE 
    WHEN p.role = 'super_admin' AND sa.is_active = true THEN 'SUPER ADMIN VALIDE'
    WHEN p.role = 'super_admin' AND sa.is_active = false THEN 'ROLE SUPER_ADMIN MAIS INACTIF'
    WHEN p.role != 'super_admin' AND sa.user_id IS NOT NULL THEN 'DANS SUPER_ADMINS MAIS ROLE DIFFERENT'
    ELSE 'PAS SUPER ADMIN'
  END as status
FROM profiles p
LEFT JOIN super_admins sa ON p.id = sa.user_id
WHERE p.email = 'contentin.cabinet@gmail.com';

-- 4. Vérifier si timdarcypro@gmail.com est super admin
SELECT 
  'CHECK TIMDARCYPRO' as "Info",
  p.id,
  p.email,
  p.role,
  sa.user_id IS NOT NULL as is_in_super_admins,
  sa.is_active,
  CASE 
    WHEN p.role = 'super_admin' AND sa.is_active = true THEN 'SUPER ADMIN VALIDE'
    WHEN p.role = 'super_admin' AND sa.is_active = false THEN 'ROLE SUPER_ADMIN MAIS INACTIF'
    WHEN p.role != 'super_admin' AND sa.user_id IS NOT NULL THEN 'DANS SUPER_ADMINS MAIS ROLE DIFFERENT'
    ELSE 'PAS SUPER ADMIN'
  END as status
FROM profiles p
LEFT JOIN super_admins sa ON p.id = sa.user_id
WHERE p.email = 'timdarcypro@gmail.com';




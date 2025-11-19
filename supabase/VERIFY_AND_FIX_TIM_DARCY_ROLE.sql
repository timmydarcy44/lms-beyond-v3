-- Script pour vérifier et corriger le rôle de timmydarcy44@gmail.com
-- Ce script vérifie le rôle dans profiles et org_memberships, puis le corrige si nécessaire

-- 1. Vérifier l'état actuel
SELECT 
  '=== ÉTAT ACTUEL ===' as "Info",
  u.email,
  p.id as profile_id,
  p.role as profile_role,
  p.full_name,
  om.role as org_membership_role,
  o.name as org_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.org_memberships om ON om.user_id = u.id
LEFT JOIN public.organizations o ON o.id = om.org_id
WHERE u.email = 'timmydarcy44@gmail.com';

-- 2. Corriger le rôle dans profiles si nécessaire
UPDATE public.profiles
SET role = 'instructor'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'timmydarcy44@gmail.com'
)
AND (role IS NULL OR role != 'instructor');

-- 3. Corriger le rôle dans org_memberships si nécessaire
UPDATE public.org_memberships
SET role = 'instructor'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'timmydarcy44@gmail.com'
)
AND (role IS NULL OR role != 'instructor');

-- 4. Vérifier le résultat après correction
SELECT 
  '=== ÉTAT APRÈS CORRECTION ===' as "Info",
  u.email,
  p.id as profile_id,
  p.role as profile_role,
  p.full_name,
  om.role as org_membership_role,
  o.name as org_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.org_memberships om ON om.user_id = u.id
LEFT JOIN public.organizations o ON o.id = om.org_id
WHERE u.email = 'timmydarcy44@gmail.com';

RAISE NOTICE '✓ Rôle vérifié et corrigé pour timmydarcy44@gmail.com';


-- ============================================
-- CORRECTION DU RÔLE DANS ORG_MEMBERSHIPS
-- ============================================
-- Problème : timmydarcy44@gmail.com a role = 'instructor' dans profiles
-- mais role = 'learner' dans org_memberships (incohérent)
-- Solution : Mettre à jour le rôle dans org_memberships pour qu'il soit 'instructor'
-- ============================================

-- Mettre à jour le rôle dans org_memberships pour les utilisateurs qui ont role = 'instructor' dans profiles
UPDATE public.org_memberships
SET role = 'instructor'
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE role = 'instructor'
)
AND role = 'learner';

-- Vérification : Afficher les utilisateurs corrigés
SELECT 
  p.email,
  p.role as profile_role,
  om.role as membership_role,
  om.org_id,
  o.name as org_name
FROM public.profiles p
LEFT JOIN public.org_memberships om ON p.id = om.user_id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.role = 'instructor'
ORDER BY p.email;

-- Vérification spécifique pour timmydarcy44@gmail.com
SELECT 
  'VÉRIFICATION timmydarcy44@gmail.com' as "Info",
  p.email,
  p.role as profile_role,
  om.role as membership_role,
  om.org_id,
  o.name as org_name
FROM public.profiles p
LEFT JOIN public.org_memberships om ON p.id = om.user_id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email = 'timmydarcy44@gmail.com';

RAISE NOTICE '✓ Rôles corrigés dans org_memberships pour les formateurs';




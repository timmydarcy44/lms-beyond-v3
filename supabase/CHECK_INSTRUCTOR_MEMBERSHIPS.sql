-- ============================================
-- Script pour vérifier les membreships de l'instructeur
-- ============================================
-- Remplacez l'UUID par celui du formateur si nécessaire
-- ============================================

-- 1. Vérifier l'UUID du formateur timmydarcy44@gmail.com
SELECT 
  'UTILISATEUR FORMATEUR' as "Vérification",
  u.id as "user_id",
  u.email as "email"
FROM auth.users u
WHERE u.email = 'timmydarcy44@gmail.com';

-- 2. Vérifier TOUS les membreships de cet utilisateur (sans RLS, en tant qu'admin)
-- Note: Exécutez cette requête avec le service role ou en tant qu'admin
SELECT 
  'MEMBERSHIPS DIRECTS' as "Vérification",
  om.org_id,
  om.user_id,
  om.role,
  o.name as "org_name",
  p.email as "profile_email"
FROM public.org_memberships om
LEFT JOIN public.organizations o ON om.org_id = o.id
LEFT JOIN public.profiles p ON om.user_id = p.id
WHERE p.email = 'timmydarcy44@gmail.com'
ORDER BY om.role, o.name;

-- 3. Vérifier si la policy org_memberships_self fonctionne
-- Cette requête simule ce que fait le client avec auth.uid()
-- Remplacez '225f10f7-850b-4897-8ed6-637cf5ea0cd5' par le vrai UUID
SELECT 
  'TEST POLICY SELF' as "Vérification",
  om.org_id,
  om.user_id,
  om.role
FROM public.org_memberships om
WHERE om.user_id = '225f10f7-850b-4897-8ed6-637cf5ea0cd5'
  -- Cette condition simule auth.uid() = user_id
ORDER BY om.role;




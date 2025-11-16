-- ============================================
-- Script pour vérifier l'accès aux ressources
-- ============================================

-- 1. Vérifier le profil de timmydarcy44@gmail.com
SELECT 
  'PROFIL FORMATEUR' as "Info",
  p.id as "user_id",
  p.email,
  p.role
FROM public.profiles p
WHERE p.email = 'timmydarcy44@gmail.com';

-- 2. Vérifier les membreships de timmydarcy44@gmail.com
SELECT 
  'MEMBERSHIPS' as "Info",
  om.org_id,
  om.user_id,
  om.role,
  o.name as "org_name"
FROM public.org_memberships om
LEFT JOIN public.organizations o ON om.org_id = o.id
LEFT JOIN public.profiles p ON om.user_id = p.id
WHERE p.email = 'timmydarcy44@gmail.com'
ORDER BY om.role;

-- 3. Vérifier la ressource spécifique
SELECT 
  'RESSOURCE SPECIFIQUE' as "Info",
  r.id,
  r.title,
  r.created_by,
  r.org_id,
  p_creator.email as "creator_email",
  o.name as "org_name"
FROM public.resources r
LEFT JOIN public.profiles p_creator ON r.created_by = p_creator.id
LEFT JOIN public.organizations o ON r.org_id = o.id
WHERE r.id = '8fca571c-7bea-45cb-ab36-b9afe3aa6948';

-- 4. Vérifier si le formateur peut voir cette ressource
-- (Simuler la requête que fait getFormateurContentLibrary)
SELECT 
  'TEST VISIBILITE' as "Info",
  r.id,
  r.title,
  r.created_by,
  r.org_id,
  CASE 
    WHEN r.created_by = (SELECT id FROM public.profiles WHERE email = 'timmydarcy44@gmail.com') THEN 'VISIBLE par created_by'
    WHEN r.org_id IN (SELECT org_id FROM public.org_memberships om 
                      JOIN public.profiles p ON om.user_id = p.id 
                      WHERE p.email = 'timmydarcy44@gmail.com' 
                      AND om.role IN ('instructor', 'admin', 'tutor')) THEN 'VISIBLE par org_id'
    ELSE 'NON VISIBLE'
  END as "visibilite"
FROM public.resources r
WHERE r.id = '8fca571c-7bea-45cb-ab36-b9afe3aa6948';

-- 5. Vérifier les politiques RLS sur resources
SELECT 
  'POLICIES RLS RESOURCES' as "Info",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;




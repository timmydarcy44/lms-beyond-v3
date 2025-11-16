-- ============================================
-- Script de test des RLS policies pour les formateurs
-- ============================================
-- Ce script teste si un formateur peut voir les apprenants
-- Exécutez ce script en tant que l'utilisateur timmydarcy44@gmail.com
-- via Supabase Studio après vous être connecté avec ce compte
-- ============================================

-- 1. Vérifier l'ID de l'utilisateur actuel (doit être celui de timmydarcy44@gmail.com)
SELECT 
  'UTILISATEUR ACTUEL' as "Test",
  auth.uid() as "user_id",
  p.email as "email",
  p.role as "role"
FROM public.profiles p
WHERE p.id = auth.uid();

-- 2. Vérifier les membreships instructor de l'utilisateur actuel
SELECT 
  'MEMBERSHIPS INSTRUCTOR' as "Test",
  om.org_id,
  om.user_id,
  om.role,
  o.name as "org_name"
FROM public.org_memberships om
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE om.user_id = auth.uid()
  AND om.role = 'instructor';

-- 3. Tester la policy org_memberships_instructor_read_learners
-- (Ceci devrait retourner les apprenants si la policy fonctionne)
SELECT 
  'TEST POLICY LEARNERS' as "Test",
  om.user_id,
  om.org_id,
  om.role,
  p.email as "learner_email",
  p.full_name as "learner_name"
FROM public.org_memberships om
LEFT JOIN public.profiles p ON om.user_id = p.id
WHERE om.role = 'learner'
  AND EXISTS (
    SELECT 1 FROM public.org_memberships om_instructor
    WHERE om_instructor.org_id = om.org_id
      AND om_instructor.user_id = auth.uid()
      AND om_instructor.role = 'instructor'
  );

-- 4. Tester la policy org_memberships_instructor_read_org
-- (Ceci devrait retourner tous les membreships dans les orgs du formateur)
SELECT 
  'TEST POLICY ALL MEMBERSHIPS' as "Test",
  om.user_id,
  om.org_id,
  om.role,
  p.email,
  p.full_name
FROM public.org_memberships om
LEFT JOIN public.profiles p ON om.user_id = p.id
WHERE EXISTS (
    SELECT 1 FROM public.org_memberships om_instructor
    WHERE om_instructor.org_id = om.org_id
      AND om_instructor.user_id = auth.uid()
      AND om_instructor.role = 'instructor'
  );

-- 5. Tester la policy profiles_instructor_read_learners
SELECT 
  'TEST POLICY PROFILES' as "Test",
  p.id,
  p.email,
  p.full_name
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.org_memberships om_learner
  JOIN public.org_memberships om_instructor 
    ON om_learner.org_id = om_instructor.org_id
  WHERE om_learner.user_id = p.id
    AND om_learner.role = 'learner'
    AND om_instructor.user_id = auth.uid()
    AND om_instructor.role = 'instructor'
);

-- 6. Vérifier toutes les policies existantes
SELECT 
  'POLICIES EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('org_memberships', 'profiles')
ORDER BY tablename, policyname;




-- ============================================
-- DIAGNOSTIC : POURQUOI UN FORMATEUR NE VOIT PAS SES APPRENANTS
-- ============================================
-- Remplacez 'timmydarcy44@gmail.com' par l'email du formateur à diagnostiquer
-- ============================================

-- 1. Vérifier si la fonction get_instructor_learners existe
SELECT 
  'FONCTION_EXISTS' as "Type",
  EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_instructor_learners' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) as "Valeur",
  'La fonction get_instructor_learners doit exister' as "Note";

-- 2. Trouver l'ID du formateur
SELECT 
  'FORMATEUR_ID' as "Type",
  p.id as "user_id",
  p.email,
  p.full_name,
  p.role as "role_profile"
FROM public.profiles p
WHERE p.email = 'timmydarcy44@gmail.com';

-- 3. Vérifier les membreships du formateur
SELECT 
  'FORMATEUR_MEMBERSHIPS' as "Type",
  om.org_id,
  om.user_id,
  om.role,
  o.name as "org_name",
  o.id as "org_id_verified"
FROM public.org_memberships om
LEFT JOIN public.organizations o ON om.org_id = o.id
JOIN public.profiles p ON om.user_id = p.id
WHERE p.email = 'timmydarcy44@gmail.com';

-- 4. Trouver les apprenants dans les mêmes organisations
WITH formateur_orgs AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE p.email = 'timmydarcy44@gmail.com'
    AND om.role = 'instructor'
)
SELECT 
  'APPRENANTS_IN_ORGS' as "Type",
  p.id as "learner_id",
  p.email as "learner_email",
  p.full_name as "learner_full_name",
  om.org_id,
  o.name as "org_name"
FROM public.org_memberships om
JOIN formateur_orgs fo ON om.org_id = fo.org_id
JOIN public.profiles p ON om.user_id = p.id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE om.role = 'learner'
ORDER BY p.full_name, p.email;

-- 5. Tester la fonction get_instructor_learners directement
-- Remplacez l'UUID par celui du formateur trouvé à l'étape 2
SELECT 
  'FONCTION_TEST' as "Type",
  learner_id,
  learner_email,
  learner_full_name,
  org_id,
  org_name
FROM public.get_instructor_learners(
  (SELECT id FROM public.profiles WHERE email = 'timmydarcy44@gmail.com' LIMIT 1)
)
ORDER BY learner_full_name, learner_email;

-- 6. Vérifier les RLS policies sur org_memberships
SELECT 
  'RLS_POLICIES' as "Type",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'org_memberships'
ORDER BY policyname;


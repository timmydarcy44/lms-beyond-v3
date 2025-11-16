-- Vérifier pourquoi j.contentin@laposte.net n'est pas visible pour timmydarcy44@gmail.com
-- ============================================

-- 1. Vérifier que l'apprenant existe
SELECT 
  'Apprenant j.contentin@laposte.net' as check_name,
  id as learner_id,
  email,
  full_name,
  role
FROM public.profiles
WHERE email = 'j.contentin@laposte.net';

-- 2. Vérifier que le formateur existe
SELECT 
  'Formateur timmydarcy44@gmail.com' as check_name,
  id as instructor_id,
  email,
  full_name,
  role
FROM public.profiles
WHERE email = 'timmydarcy44@gmail.com';

-- 3. Vérifier les membreships de l'apprenant
SELECT 
  'Membreships de l''apprenant' as check_name,
  om.org_id,
  om.user_id,
  om.role,
  o.name as org_name
FROM public.org_memberships om
JOIN public.organizations o ON o.id = om.org_id
WHERE om.user_id = (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
);

-- 4. Vérifier les membreships du formateur
SELECT 
  'Membreships du formateur' as check_name,
  om.org_id,
  om.user_id,
  om.role,
  o.name as org_name
FROM public.org_memberships om
JOIN public.organizations o ON o.id = om.org_id
WHERE om.user_id = (
  SELECT id FROM public.profiles WHERE email = 'timmydarcy44@gmail.com'
);

-- 5. Vérifier si l'apprenant et le formateur sont dans la même organisation
SELECT 
  'Organisations communes' as check_name,
  learner_om.org_id,
  o.name as org_name,
  learner_om.role as learner_role,
  instructor_om.role as instructor_role
FROM public.org_memberships learner_om
JOIN public.org_memberships instructor_om ON learner_om.org_id = instructor_om.org_id
JOIN public.organizations o ON o.id = learner_om.org_id
WHERE learner_om.user_id = (SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net')
  AND instructor_om.user_id = (SELECT id FROM public.profiles WHERE email = 'timmydarcy44@gmail.com')
  AND learner_om.role = 'learner'
  AND instructor_om.role IN ('instructor', 'admin', 'tutor');

-- 6. Tester la fonction get_instructor_learners
SELECT 
  'Résultat de get_instructor_learners' as check_name,
  *
FROM get_instructor_learners((
  SELECT id FROM public.profiles WHERE email = 'timmydarcy44@gmail.com'
));





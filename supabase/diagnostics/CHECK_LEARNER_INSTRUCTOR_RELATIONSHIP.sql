-- ============================================
-- VÉRIFIER LA RELATION APPRENANT-FORMATEUR
-- ============================================

-- Variables
\set learner_email 'j.contentin@laposte.net'
\set instructor_email 'timmydarcy44@gmail.com'

-- 1. Vérifier que l'apprenant existe
SELECT 
  'LEARNER_PROFILE' as "Check",
  id,
  email,
  full_name,
  role
FROM public.profiles
WHERE email = :'learner_email';

-- 2. Vérifier que le formateur existe
SELECT 
  'INSTRUCTOR_PROFILE' as "Check",
  id,
  email,
  full_name,
  role
FROM public.profiles
WHERE email = :'instructor_email';

-- 3. Vérifier les membreships de l'apprenant
SELECT 
  'LEARNER_MEMBERSHIPS' as "Check",
  om.id,
  om.org_id,
  om.user_id,
  om.role,
  o.name as org_name
FROM public.org_memberships om
JOIN public.profiles p ON om.user_id = p.id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email = :'learner_email'
ORDER BY om.created_at DESC;

-- 4. Vérifier les membreships du formateur
SELECT 
  'INSTRUCTOR_MEMBERSHIPS' as "Check",
  om.id,
  om.org_id,
  om.user_id,
  om.role,
  o.name as org_name
FROM public.org_memberships om
JOIN public.profiles p ON om.user_id = p.id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email = :'instructor_email'
ORDER BY om.created_at DESC;

-- 5. Vérifier les organisations communes
WITH learner_orgs AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE p.email = :'learner_email'
    AND om.role = 'learner'
),
instructor_orgs AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE p.email = :'instructor_email'
    AND om.role = 'instructor'
)
SELECT 
  'COMMON_ORGANIZATIONS' as "Check",
  lo.org_id,
  o.name as org_name
FROM learner_orgs lo
JOIN instructor_orgs io ON lo.org_id = io.org_id
LEFT JOIN public.organizations o ON lo.org_id = o.id;

-- 6. Vérifier les formateurs visibles pour l'apprenant (simulation de l'API)
WITH learner_orgs AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE p.email = :'learner_email'
    AND om.role = 'learner'
),
instructors_in_orgs AS (
  SELECT DISTINCT om.user_id, om.org_id
  FROM public.org_memberships om
  JOIN learner_orgs lo ON om.org_id = lo.org_id
  WHERE om.role = 'instructor'
)
SELECT 
  'AVAILABLE_INSTRUCTORS' as "Check",
  p.id,
  p.email,
  p.full_name,
  iio.org_id,
  o.name as org_name
FROM instructors_in_orgs iio
JOIN public.profiles p ON iio.user_id = p.id
LEFT JOIN public.organizations o ON iio.org_id = o.id
ORDER BY p.full_name, p.email;

-- 7. Vérifier les assignations explicites (content_assignments)
SELECT 
  'EXPLICIT_ASSIGNMENTS' as "Check",
  ca.id,
  ca.content_type,
  ca.content_id,
  ca.learner_id,
  p_learner.email as learner_email,
  p_instructor.email as instructor_email
FROM public.content_assignments ca
JOIN public.profiles p_learner ON ca.learner_id = p_learner.id
JOIN public.courses c ON ca.content_id = c.id AND ca.content_type = 'course'
JOIN public.profiles p_instructor ON c.creator_id = p_instructor.id OR c.owner_id = p_instructor.id
WHERE p_learner.email = :'learner_email'
  AND p_instructor.email = :'instructor_email';

-- 8. Vérifier les enrollments (si utilisés)
SELECT 
  'ENROLLMENTS' as "Check",
  e.id,
  e.course_id,
  e.user_id,
  e.learner_id,
  c.title as course_title,
  p_learner.email as learner_email,
  p_instructor.email as instructor_email
FROM public.enrollments e
LEFT JOIN public.courses c ON e.course_id = c.id
LEFT JOIN public.profiles p_learner ON (e.user_id = p_learner.id OR e.learner_id = p_learner.id)
LEFT JOIN public.profiles p_instructor ON (c.creator_id = p_instructor.id OR c.owner_id = p_instructor.id)
WHERE p_learner.email = :'learner_email'
  AND p_instructor.email = :'instructor_email';





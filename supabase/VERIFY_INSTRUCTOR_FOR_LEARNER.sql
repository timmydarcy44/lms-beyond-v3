-- ============================================
-- VÉRIFIER POURQUOI L'APPRENANT NE VOIT PAS LE FORMATEUR
-- ============================================

-- 1. Vérifier que l'apprenant existe et ses membreships
SELECT 
  '1. LEARNER INFO' as "Step",
  p.id as learner_id,
  p.email as learner_email,
  p.full_name as learner_name,
  p.role as learner_role,
  om.org_id,
  om.user_id,
  om.role as membership_role,
  o.name as org_name
FROM public.profiles p
LEFT JOIN public.org_memberships om ON p.id = om.user_id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email = 'j.contentin@laposte.net'
ORDER BY o.name;

-- 2. Vérifier que le formateur existe et ses membreships
SELECT 
  '2. INSTRUCTOR INFO' as "Step",
  p.id as instructor_id,
  p.email as instructor_email,
  p.full_name as instructor_name,
  p.role as instructor_role,
  om.org_id,
  om.user_id,
  om.role as membership_role,
  o.name as org_name
FROM public.profiles p
LEFT JOIN public.org_memberships om ON p.id = om.user_id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email = 'timmydarcy44@gmail.com'
ORDER BY o.name;

-- 3. Vérifier les organisations communes
WITH learner_orgs AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE p.email = 'j.contentin@laposte.net'
    AND om.role = 'learner'
),
instructor_orgs AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE p.email = 'timmydarcy44@gmail.com'
    AND om.role = 'instructor'
)
SELECT 
  '3. COMMON ORGS' as "Step",
  lo.org_id,
  o.name as org_name,
  EXISTS (
    SELECT 1 FROM public.org_memberships om
    JOIN public.profiles p ON om.user_id = p.id
    WHERE om.org_id = lo.org_id 
      AND p.email = 'j.contentin@laposte.net'
      AND om.role = 'learner'
  ) as learner_in_org,
  EXISTS (
    SELECT 1 FROM public.org_memberships om
    JOIN public.profiles p ON om.user_id = p.id
    WHERE om.org_id = lo.org_id 
      AND p.email = 'timmydarcy44@gmail.com'
      AND om.role = 'instructor'
  ) as instructor_in_org
FROM learner_orgs lo
JOIN instructor_orgs io ON lo.org_id = io.org_id
LEFT JOIN public.organizations o ON lo.org_id = o.id;

-- 4. Simuler la requête exacte de l'API
WITH learner_orgs AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE p.email = 'j.contentin@laposte.net'
    AND om.role = 'learner'
),
instructor_memberships AS (
  SELECT DISTINCT om.user_id, om.org_id
  FROM public.org_memberships om
  JOIN learner_orgs lo ON om.org_id = lo.org_id
  WHERE om.role = 'instructor'
)
SELECT 
  '4. API SIMULATION' as "Step",
  im.user_id as instructor_id,
  im.org_id,
  p.email as instructor_email,
  p.full_name as instructor_name
FROM instructor_memberships im
JOIN public.profiles p ON im.user_id = p.id
ORDER BY p.full_name, p.email;


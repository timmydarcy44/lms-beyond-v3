-- ============================================
-- DIAGNOSTIC COMPLET DE L'API /api/drive/instructors
-- Simule exactement ce que fait l'API Next.js
-- ============================================

-- Variable (hardcodée pour Supabase SQL Editor)
DO $$
DECLARE
  learner_email text := 'j.contentin@laposte.net';
  learner_user_id uuid;
BEGIN
  -- ÉTAPE 1 : Récupérer l'ID de l'apprenant
  SELECT id INTO learner_user_id
  FROM public.profiles
  WHERE email = learner_email;
  
  RAISE NOTICE 'ÉTAPE 1 - Learner User ID: %', learner_user_id;
END $$;

-- ÉTAPE 1 (affichage) : Récupérer l'ID de l'apprenant
SELECT 
  '1. LEARNER USER ID' as "Step",
  id as learner_user_id,
  email,
  full_name,
  role
FROM public.profiles
WHERE email = 'j.contentin@laposte.net';

-- ÉTAPE 2 : Récupérer les membreships de l'apprenant avec role='learner'
-- C'est la première requête de l'API
WITH learner_user AS (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1
)
SELECT 
  '2. LEARNER MEMBERSHIPS' as "Step",
  om.org_id,
  om.user_id,
  om.role,
  o.name as org_name,
  COUNT(*) OVER() as total_count
FROM public.org_memberships om
JOIN learner_user lu ON om.user_id = lu.id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE om.role = 'learner'
ORDER BY om.org_id;

-- ÉTAPE 3 : Si pas de membreships, on s'arrête ici (comme l'API)
-- Vérifier combien de membreships sont trouvés
WITH learner_user AS (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1
),
learner_memberships AS (
  SELECT om.org_id
  FROM public.org_memberships om
  JOIN learner_user lu ON om.user_id = lu.id
  WHERE om.role = 'learner'
)
SELECT 
  '3. MEMBERSHIPS COUNT' as "Step",
  COUNT(*) as membership_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ API RETOURNERA [] (pas de membreships)'
    ELSE '✅ Membreships trouvés'
  END as status
FROM learner_memberships;

-- ÉTAPE 4 : Récupérer les org_ids
WITH learner_user AS (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1
),
learner_memberships AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN learner_user lu ON om.user_id = lu.id
  WHERE om.role = 'learner'
)
SELECT 
  '4. ORGANIZATION IDs' as "Step",
  org_id,
  o.name as org_name
FROM learner_memberships lm
LEFT JOIN public.organizations o ON lm.org_id = o.id
ORDER BY o.name;

-- ÉTAPE 5 : Récupérer les formateurs dans ces organisations
WITH learner_user AS (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1
),
learner_memberships AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN learner_user lu ON om.user_id = lu.id
  WHERE om.role = 'learner'
)
SELECT 
  '5. INSTRUCTOR MEMBERSHIPS' as "Step",
  om.user_id as instructor_user_id,
  om.org_id,
  om.role,
  p.email as instructor_email,
  p.full_name as instructor_name,
  o.name as org_name,
  COUNT(*) OVER() as total_instructors_found
FROM public.org_memberships om
JOIN learner_memberships lm ON om.org_id = lm.org_id
JOIN public.profiles p ON om.user_id = p.id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE om.role = 'instructor'
ORDER BY p.full_name, p.email;

-- ÉTAPE 6 : Vérifier si des formateurs sont trouvés
WITH learner_user AS (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1
),
learner_memberships AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN learner_user lu ON om.user_id = lu.id
  WHERE om.role = 'learner'
),
instructor_memberships AS (
  SELECT DISTINCT om.user_id
  FROM public.org_memberships om
  JOIN learner_memberships lm ON om.org_id = lm.org_id
  WHERE om.role = 'instructor'
)
SELECT 
  '6. INSTRUCTORS COUNT' as "Step",
  COUNT(*) as instructor_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ API RETOURNERA [] (pas de formateurs trouvés)'
    ELSE '✅ Formateurs trouvés'
  END as status
FROM instructor_memberships;

-- ÉTAPE 7 : Récupérer les profils des formateurs (dernière étape de l'API)
WITH learner_user AS (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1
),
learner_memberships AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN learner_user lu ON om.user_id = lu.id
  WHERE om.role = 'learner'
),
instructor_memberships AS (
  SELECT DISTINCT om.user_id
  FROM public.org_memberships om
  JOIN learner_memberships lm ON om.org_id = lm.org_id
  WHERE om.role = 'instructor'
)
SELECT 
  '7. FINAL INSTRUCTORS LIST' as "Step",
  p.id,
  p.email,
  COALESCE(p.full_name, p.email, 'Formateur') as name,
  CASE 
    WHEN COUNT(*) OVER() = 0 THEN '❌ API RETOURNERA []'
    ELSE '✅ API RETOURNERA CETTE LISTE'
  END as api_result
FROM instructor_memberships im
JOIN public.profiles p ON im.user_id = p.id
ORDER BY p.full_name, p.email;

-- ÉTAPE 8 : Résumé final - ce que l'API devrait retourner
WITH learner_user AS (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1
),
learner_memberships AS (
  SELECT DISTINCT om.org_id
  FROM public.org_memberships om
  JOIN learner_user lu ON om.user_id = lu.id
  WHERE om.role = 'learner'
),
instructor_memberships AS (
  SELECT DISTINCT om.user_id
  FROM public.org_memberships om
  JOIN learner_memberships lm ON om.org_id = lm.org_id
  WHERE om.role = 'instructor'
),
final_instructors AS (
  SELECT 
    p.id,
    p.email,
    COALESCE(p.full_name, p.email, 'Formateur') as name
  FROM instructor_memberships im
  JOIN public.profiles p ON im.user_id = p.id
)
SELECT 
  '8. SUMMARY' as "Step",
  COUNT(*) as final_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ PROBLÈME: API retournera instructors: []'
    ELSE '✅ OK: API devrait retourner ' || COUNT(*)::text || ' formateur(s)'
  END as diagnosis
FROM final_instructors;


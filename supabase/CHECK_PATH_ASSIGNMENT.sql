-- Script pour vérifier l'assignation de parcours à un apprenant
-- ===============================================================
-- Remplacez l'email par celui de Jessica Contentin (j.contentin@laposte.net)
-- ===============================================================

-- 1. Vérifier l'ID de l'apprenant
SELECT 
  'APPRENANT' as "Info",
  p.id as "user_id",
  p.email,
  p.full_name
FROM public.profiles p
WHERE p.email = 'j.contentin@laposte.net';

-- 2. Vérifier les parcours assignés à cet apprenant dans path_progress
-- Remplacez l'ID de l'utilisateur ci-dessous par celui trouvé dans la requête précédente
SELECT 
  'PARCOURS ASSIGNÉS' as "Info",
  pp.user_id,
  pp.path_id,
  pp.progress_percent,
  pp.last_accessed_at,
  p.title as "path_title",
  p.status as "path_status",
  p.owner_id,
  p.creator_id
FROM public.path_progress pp
LEFT JOIN public.paths p ON pp.path_id = p.id
WHERE pp.user_id = (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
);

-- 3. Vérifier tous les parcours disponibles pour cet apprenant (via ses formateurs)
SELECT 
  'PARCOURS DISPONIBLES (via formateurs)' as "Info",
  path.id,
  path.title,
  path.status,
  path.owner_id,
  path.creator_id,
  owner_p.email as "owner_email",
  creator_p.email as "creator_email"
FROM public.paths path
LEFT JOIN public.profiles owner_p ON path.owner_id = owner_p.id
LEFT JOIN public.profiles creator_p ON path.creator_id = creator_p.id
WHERE path.status = 'published'
  AND (
    path.owner_id IN (
      SELECT DISTINCT om_instructor.user_id
      FROM public.org_memberships om_learner
      JOIN public.org_memberships om_instructor 
        ON om_learner.org_id = om_instructor.org_id
      WHERE om_learner.user_id = (
        SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
      )
        AND om_learner.role = 'learner'
        AND om_instructor.role = 'instructor'
    )
    OR path.creator_id IN (
      SELECT DISTINCT om_instructor.user_id
      FROM public.org_memberships om_learner
      JOIN public.org_memberships om_instructor 
        ON om_learner.org_id = om_instructor.org_id
      WHERE om_learner.user_id = (
        SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
      )
        AND om_learner.role = 'learner'
        AND om_instructor.role = 'instructor'
    )
  )
ORDER BY path.updated_at DESC;

-- 4. Vérifier les RLS policies pour path_progress
SELECT 
  'RLS POLICIES PATH_PROGRESS' as "Info",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'path_progress'
ORDER BY policyname;

-- 5. Vérifier si l'apprenant peut lire path_progress (test RLS)
-- Exécutez cette requête en étant connecté en tant que l'apprenant
SELECT 
  'TEST RLS PATH_PROGRESS' as "Info",
  COUNT(*) as "count",
  string_agg(DISTINCT path_id::text, ', ') as "path_ids"
FROM public.path_progress
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net'
);




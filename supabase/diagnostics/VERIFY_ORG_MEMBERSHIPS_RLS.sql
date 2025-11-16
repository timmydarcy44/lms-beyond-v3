-- ============================================
-- VÉRIFIER QUE LES POLICIES RLS SONT BIEN CRÉÉES
-- ============================================

-- 1. Vérifier toutes les policies sur org_memberships
SELECT 
  'ALL POLICIES' as "Info",
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'org_memberships'
ORDER BY policyname;

-- 2. Vérifier que les policies pour les apprenants existent
SELECT 
  'LEARNER POLICIES' as "Info",
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'org_memberships'
  AND (
    policyname LIKE '%learner%'
    OR policyname LIKE '%read%'
  )
ORDER BY policyname;

-- 3. Test : Simuler une requête d'apprenant lisant les formateurs
-- (Ce test utilise un SET ROLE pour simuler l'apprenant)
DO $$
DECLARE
  v_learner_id uuid;
  v_org_id uuid;
  v_instructor_count int;
BEGIN
  -- Récupérer l'ID de l'apprenant
  SELECT id INTO v_learner_id
  FROM public.profiles
  WHERE email = 'j.contentin@laposte.net'
  LIMIT 1;
  
  -- Récupérer l'org_id
  SELECT om.org_id INTO v_org_id
  FROM public.org_memberships om
  WHERE om.user_id = v_learner_id
    AND om.role = 'learner'
  LIMIT 1;
  
  -- Simuler la requête avec SET ROLE (nécessite d'être superuser)
  -- Pour l'instant, on teste juste que les données existent
  SELECT COUNT(*) INTO v_instructor_count
  FROM public.org_memberships om
  WHERE om.org_id = v_org_id
    AND om.role = 'instructor';
  
  RAISE NOTICE 'Learner: %, Org: %, Instructors found: %', v_learner_id, v_org_id, v_instructor_count;
END $$;

-- 4. Test direct de la fonction helper
SELECT 
  'FUNCTION TEST' as "Info",
  public.is_user_member_of_org(
    (SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1),
    '53e793ca-fc47-402b-bc90-cea5c588c0e8'
  ) as learner_can_read,
  EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.org_id = '53e793ca-fc47-402b-bc90-cea5c588c0e8'
      AND om.role = 'instructor'
      AND public.is_user_member_of_org(
        (SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1),
        '53e793ca-fc47-402b-bc90-cea5c588c0e8'
      )
  ) as can_see_instructors;


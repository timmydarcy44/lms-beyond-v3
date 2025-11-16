-- ============================================
-- Vérifier si l'apprenant a bien un enrollment
-- ============================================
-- Remplacez l'email par celui de votre apprenant

DO $$
DECLARE
  v_learner_email text := 'j.contentin@laposte.net';
  v_learner_id uuid;
  v_enrollment_count integer;
BEGIN
  -- Récupérer l'ID de l'apprenant
  SELECT id INTO v_learner_id
  FROM public.profiles
  WHERE email = v_learner_email;

  IF v_learner_id IS NULL THEN
    RAISE NOTICE '⚠ Apprenant non trouvé avec l''email: %', v_learner_email;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Apprenant trouvé: % (ID: %)', v_learner_email, v_learner_id;

  -- Compter les enrollments
  SELECT COUNT(*) INTO v_enrollment_count
  FROM public.enrollments
  WHERE learner_id = v_learner_id;

  RAISE NOTICE 'Nombre d''enrollments: %', v_enrollment_count;

  -- Afficher les enrollments avec les détails des cours
  RAISE NOTICE '';
  RAISE NOTICE '=== ENROLLMENTS ===';
  FOR rec IN 
    SELECT 
      e.id as enrollment_id,
      e.course_id,
      e.learner_id,
      e.role,
      c.title as course_title,
      c.status as course_status,
      c.owner_id as course_owner_id,
      c.creator_id as course_creator_id
    FROM public.enrollments e
    LEFT JOIN public.courses c ON e.course_id = c.id
    WHERE e.learner_id = v_learner_id
  LOOP
    RAISE NOTICE 'Enrollment ID: %, Course: % (ID: %), Status: %, Owner: %, Creator: %', 
      rec.enrollment_id, 
      rec.course_title, 
      rec.course_id,
      rec.course_status,
      rec.course_owner_id,
      rec.course_creator_id;
  END LOOP;
END $$;




-- ============================================
-- Script pour restaurer le creator_id correct pour une formation spécifique
-- ============================================
-- Usage: Modifier les variables au début pour la formation et le créateur
-- ============================================

DO $$
DECLARE
  v_course_id uuid := 'eff32bf7-fcb0-4751-91ba-d5e6b319f913'; -- ID de la formation à corriger
  v_correct_creator_id uuid := '17364229-fe78-4986-ac69-41b880e34631'; -- ID du vrai créateur (contentin.cabinet@gmail.com)
BEGIN
  RAISE NOTICE 'Restauration de la formation %', v_course_id;
  RAISE NOTICE 'Nouveau creator_id: % (contentin.cabinet@gmail.com)', v_correct_creator_id;
  
  -- Désactiver temporairement le trigger qui protège creator_id
  RAISE NOTICE 'Désactivation temporaire du trigger protect_courses_creator...';
  ALTER TABLE public.courses DISABLE TRIGGER protect_courses_creator;
  
  -- Restaurer le creator_id (mais garder owner_id tel quel pour ne pas perturber)
  UPDATE public.courses
  SET creator_id = v_correct_creator_id
  WHERE id = v_course_id;
  
  IF FOUND THEN
    RAISE NOTICE '✓ Formation restaurée avec le créateur correct';
    RAISE NOTICE '  - creator_id: % (contentin.cabinet@gmail.com)', v_correct_creator_id;
    RAISE NOTICE '  - owner_id reste inchangé (peut être différent du creator_id)';
  ELSE
    RAISE NOTICE '⚠ Formation non trouvée avec l''ID: %', v_course_id;
  END IF;
  
  -- Réactiver le trigger
  RAISE NOTICE 'Réactivation du trigger protect_courses_creator...';
  ALTER TABLE public.courses ENABLE TRIGGER protect_courses_creator;
  
  RAISE NOTICE '✓ Restauration terminée';
END $$;

-- Vérification
SELECT 
  id,
  title,
  creator_id,
  owner_id,
  (SELECT email FROM profiles WHERE id = courses.creator_id) as creator_email,
  (SELECT email FROM profiles WHERE id = courses.owner_id) as owner_email
FROM courses
WHERE id = 'eff32bf7-fcb0-4751-91ba-d5e6b319f913';


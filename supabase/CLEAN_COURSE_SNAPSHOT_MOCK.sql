-- ============================================
-- Nettoyer le contenu mock du builder_snapshot d'une formation
-- ============================================
-- Ce script réinitialise le builder_snapshot avec un snapshot vide
-- tout en préservant le titre et la description de la formation

DO $$
DECLARE
  v_course_title text := 'test'; -- Modifier ici le titre de la formation à nettoyer
  v_course_id uuid;
  v_course_title_db text;
  v_course_description text;
  v_course_cover_image text;
BEGIN
  -- Trouver la formation
  SELECT id, title, description, cover_image 
  INTO v_course_id, v_course_title_db, v_course_description, v_course_cover_image
  FROM public.courses
  WHERE title ILIKE '%' || v_course_title || '%'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE '⚠ Formation non trouvée avec le titre: %', v_course_title;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Formation trouvée: % (ID: %)', v_course_title_db, v_course_id;
  RAISE NOTICE 'Nettoyage du builder_snapshot...';

  -- Réinitialiser le snapshot avec un snapshot vide mais en préservant les métadonnées
  UPDATE public.courses
  SET builder_snapshot = jsonb_build_object(
    'general', jsonb_build_object(
      'title', COALESCE(v_course_title_db, ''),
      'subtitle', COALESCE(v_course_description, ''),
      'category', '',
      'level', '',
      'duration', '',
      'heroImage', COALESCE(v_course_cover_image, ''),
      'trailerUrl', '',
      'badgeLabel', '',
      'badgeDescription', ''
    ),
    'objectives', '[]'::jsonb,
    'skills', '[]'::jsonb,
    'sections', '[]'::jsonb,
    'resources', '[]'::jsonb,
    'tests', '[]'::jsonb
  )
  WHERE id = v_course_id;

  IF FOUND THEN
    RAISE NOTICE '✓ Snapshot nettoyé avec succès !';
    RAISE NOTICE 'Le snapshot contient maintenant uniquement les métadonnées de base.';
  ELSE
    RAISE NOTICE '⚠ Aucune ligne mise à jour';
  END IF;
END $$;









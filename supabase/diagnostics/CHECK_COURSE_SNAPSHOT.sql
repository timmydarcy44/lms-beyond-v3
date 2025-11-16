-- ============================================
-- Vérifier le contenu du builder_snapshot d'une formation
-- ============================================
-- Remplacez le titre ou l'ID pour la formation à vérifier

DO $$
DECLARE
  v_course_title text := 'test'; -- Modifier ici le titre de la formation
  v_course_id uuid;
  v_snapshot jsonb;
BEGIN
  -- Trouver la formation
  SELECT id, builder_snapshot INTO v_course_id, v_snapshot
  FROM public.courses
  WHERE title ILIKE '%' || v_course_title || '%'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE '⚠ Formation non trouvée avec le titre: %', v_course_title;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Formation trouvée: % (ID: %)', v_course_title, v_course_id;
  RAISE NOTICE '';
  RAISE NOTICE '=== CONTENU DU BUILDER_SNAPSHOT ===';
  RAISE NOTICE '';

  IF v_snapshot IS NULL THEN
    RAISE NOTICE 'Le snapshot est NULL (vide)';
  ELSE
    -- Afficher le titre général
    IF v_snapshot->'general'->>'title' IS NOT NULL THEN
      RAISE NOTICE 'Titre: %', v_snapshot->'general'->>'title';
    END IF;

    -- Compter les sections
    IF v_snapshot->'sections' IS NOT NULL THEN
      RAISE NOTICE 'Nombre de sections: %', jsonb_array_length(v_snapshot->'sections');
      
      -- Afficher les titres des sections
      FOR i IN 0..jsonb_array_length(v_snapshot->'sections') - 1 LOOP
        DECLARE
          v_section jsonb := v_snapshot->'sections'->i;
          v_section_title text := v_section->>'title';
          v_chapters_count int := jsonb_array_length(v_section->'chapters');
        BEGIN
          RAISE NOTICE '  Section %: % (% chapitres)', i+1, v_section_title, v_chapters_count;
        END;
      END LOOP;
    END IF;

    -- Compter les ressources
    IF v_snapshot->'resources' IS NOT NULL THEN
      RAISE NOTICE 'Nombre de ressources: %', jsonb_array_length(v_snapshot->'resources');
    END IF;

    -- Compter les tests
    IF v_snapshot->'tests' IS NOT NULL THEN
      RAISE NOTICE 'Nombre de tests: %', jsonb_array_length(v_snapshot->'tests');
    END IF;

    -- Détecter si c'est du contenu mock
    IF v_snapshot->'general'->>'title' ILIKE '%NeuroDesign%' 
       OR v_snapshot->'general'->>'title' ILIKE '%Neuro%'
       OR v_snapshot->'general'->>'subtitle' ILIKE '%émotionnel%'
       OR (v_snapshot->'sections' IS NOT NULL AND jsonb_array_length(v_snapshot->'sections') > 0) THEN
      RAISE NOTICE '';
      RAISE NOTICE '⚠⚠⚠ CONTENU MOCK DÉTECTÉ ⚠⚠⚠';
      RAISE NOTICE 'Le snapshot contient du contenu mock.';
      RAISE NOTICE '';
      RAISE NOTICE 'Pour nettoyer, exécutez:';
      RAISE NOTICE 'UPDATE public.courses SET builder_snapshot = jsonb_build_object(';
      RAISE NOTICE '  ''general'', jsonb_build_object(';
      RAISE NOTICE '    ''title'', title,';
      RAISE NOTICE '    ''subtitle'', description,';
      RAISE NOTICE '    ''category'', '''''',';
      RAISE NOTICE '    ''level'', '''''',';
      RAISE NOTICE '    ''duration'', '''''',';
      RAISE NOTICE '    ''heroImage'', cover_image,';
      RAISE NOTICE '    ''trailerUrl'', '''''',';
      RAISE NOTICE '    ''badgeLabel'', '''''',';
      RAISE NOTICE '    ''badgeDescription'', ''''';
      RAISE NOTICE '  ),';
      RAISE NOTICE '  ''objectives'', ''[]''::jsonb,';
      RAISE NOTICE '  ''skills'', ''[]''::jsonb,';
      RAISE NOTICE '  ''sections'', ''[]''::jsonb,';
      RAISE NOTICE '  ''resources'', ''[]''::jsonb,';
      RAISE NOTICE '  ''tests'', ''[]''::jsonb';
      RAISE NOTICE ') WHERE id = ''%'';', v_course_id;
    END IF;
  END IF;
END $$;





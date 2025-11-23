-- ============================================
-- DUPLIQUER LE TEST SOFT SKILLS DE BEYOND CARE POUR JESSICA CONTENTIN
-- ============================================
-- Ce script duplique le test "Soft Skills – Profil 360" de Beyond Care
-- pour Jessica Contentin afin qu'elle puisse l'ajouter à son catalogue

DO $$
DECLARE
  -- IDs des Super Admins
  jessica_profile_id UUID;
  
  -- Questionnaire mental_health de Beyond Care (créé par Jessica)
  beyond_care_questionnaire_id UUID;
  beyond_care_questionnaire_record RECORD;
  
  -- Test existant ou nouveau
  jessica_test_id UUID;
  jessica_test_record RECORD;
  
  -- Compteurs
  questions_duplicated INTEGER := 0;
BEGIN
  -- 1. Récupérer l'ID du profil de Jessica
  SELECT id INTO jessica_profile_id
  FROM profiles
  WHERE email = 'contentin.cabinet@gmail.com'
  LIMIT 1;
  
  IF jessica_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil Jessica non trouvé';
  END IF;
  
  RAISE NOTICE 'Jessica profile ID: %', jessica_profile_id;
  
  -- 2. Récupérer l'organisation de Jessica via org_memberships
  DECLARE
    jessica_org_id UUID;
  BEGIN
    SELECT org_id INTO jessica_org_id
    FROM org_memberships
    WHERE user_id = jessica_profile_id
    LIMIT 1;
    
    IF jessica_org_id IS NULL THEN
      RAISE WARNING 'Aucune organisation trouvée pour Jessica. Recherche du questionnaire sans filtre org_id...';
    ELSE
      RAISE NOTICE 'Jessica org ID: %', jessica_org_id;
    END IF;
    
    -- 3. Récupérer le questionnaire mental_health "Soft Skills – Profil 360" de Beyond Care
    -- (lié à l'organisation de Jessica ou créé par Jessica)
    IF jessica_org_id IS NOT NULL THEN
      SELECT * INTO beyond_care_questionnaire_record
      FROM mental_health_questionnaires
      WHERE title = 'Soft Skills – Profil 360'
        AND org_id = jessica_org_id
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
    
    -- Si pas trouvé par org_id, chercher par created_by
    IF beyond_care_questionnaire_record IS NULL THEN
      SELECT * INTO beyond_care_questionnaire_record
      FROM mental_health_questionnaires
      WHERE title = 'Soft Skills – Profil 360'
        AND created_by = jessica_profile_id
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
    
    IF beyond_care_questionnaire_record IS NULL THEN
      RAISE EXCEPTION 'Questionnaire "Soft Skills – Profil 360" non trouvé pour Jessica. Veuillez d''abord créer le questionnaire via l''interface Beyond Care ou l''API seed.';
    ELSE
      beyond_care_questionnaire_id := beyond_care_questionnaire_record.id;
      RAISE NOTICE 'Questionnaire Beyond Care trouvé: % (ID: %)', beyond_care_questionnaire_record.title, beyond_care_questionnaire_id;
    END IF;
  END;
  
  -- 3. Vérifier si un test existe déjà pour ce questionnaire
  SELECT * INTO jessica_test_record
  FROM tests
  WHERE builder_snapshot->>'questionnaireId' = beyond_care_questionnaire_id::TEXT
    AND (creator_id = jessica_profile_id OR created_by = jessica_profile_id)
  LIMIT 1;
  
  IF jessica_test_record IS NOT NULL THEN
    jessica_test_id := jessica_test_record.id;
    RAISE NOTICE 'Test existe déjà pour ce questionnaire (ID: %), mise à jour...', jessica_test_id;
  ELSE
    -- Générer un nouvel ID pour le test
    jessica_test_id := gen_random_uuid();
    RAISE NOTICE 'Nouveau test ID pour Jessica: %', jessica_test_id;
  END IF;
  
  -- 4. Créer ou mettre à jour le test
  DECLARE
    builder_snapshot JSONB;
  BEGIN
    -- Construire le builder_snapshot avec le questionnaire_id
    builder_snapshot := jsonb_build_object(
      'version', 'soft-skills-v1',
      'questionnaireType', 'mental_health',
      'questionnaireTitle', beyond_care_questionnaire_record.title,
      'questionnaireSlug', 'soft-skills-profil-360',
      'questionnaireId', beyond_care_questionnaire_id::TEXT,
      'dimensions', ARRAY[
        'gestion_emotions_stress',
        'communication_influence',
        'perseverance_action',
        'organisation_priorites',
        'empathie_ecoute_active',
        'resolution_problemes',
        'collaboration_conflits',
        'creativite_adaptabilite',
        'leadership_vision',
        'confiance_decision'
      ]
    );
    
    IF jessica_test_record IS NOT NULL THEN
      -- Mise à jour
      UPDATE tests
      SET
        title = 'Soft Skills – Profil 360',
        description = 'Évaluez 10 dimensions clés des soft skills (gestion du stress, communication, collaboration, créativité, leadership…) et obtenez un classement personnalisé.',
        status = 'published',
        published = true,
        kind = 'quiz',
        duration_minutes = 25,
        display_format = 'ranking',
        category = 'soft_skills',
        evaluation_type = 'questionnaire',
        skills = 'soft skills, communication, adaptabilité, leadership, collaboration',
        price = COALESCE(NULLIF(jessica_test_record.price, 0), 15),
        builder_snapshot = builder_snapshot,
        creator_id = jessica_profile_id,
        owner_id = jessica_profile_id,
        updated_at = NOW()
      WHERE id = jessica_test_id;
      
      RAISE NOTICE 'Test mis à jour pour Jessica';
    ELSE
      -- Insertion
      -- Utiliser l'org_id déjà récupéré plus haut, ou le récupérer à nouveau si nécessaire
      DECLARE
        test_org_id UUID;
      BEGIN
        -- Récupérer l'org_id via org_memberships
        SELECT org_id INTO test_org_id
        FROM org_memberships
        WHERE user_id = jessica_profile_id
        LIMIT 1;
        
        INSERT INTO tests (
          id,
          slug,
          org_id,
          title,
          description,
          status,
          published,
          kind,
          duration_minutes,
          display_format,
          category,
          evaluation_type,
          skills,
          price,
          builder_snapshot,
          creator_id,
          owner_id,
          created_by,
          created_at,
          updated_at
        )
        VALUES (
          jessica_test_id,
          'soft-skills-profil-360-jessica',
          test_org_id,
          'Soft Skills – Profil 360',
          'Évaluez 10 dimensions clés des soft skills (gestion du stress, communication, collaboration, créativité, leadership…) et obtenez un classement personnalisé.',
          'published',
          true,
          'quiz',
          25,
          'ranking',
          'soft_skills',
          'questionnaire',
          'soft skills, communication, adaptabilité, leadership, collaboration',
          15,
          builder_snapshot,
          jessica_profile_id,
          jessica_profile_id,
          jessica_profile_id,
          NOW(),
          NOW()
        );
        
        RAISE NOTICE 'Test créé pour Jessica';
      END;
    END IF;
  END;
  
  -- 7. Créer ou mettre à jour l'entrée dans catalog_items
  DECLARE
    existing_catalog_item_id UUID;
  BEGIN
    SELECT id INTO existing_catalog_item_id
    FROM catalog_items
    WHERE item_type = 'test'
      AND content_id = jessica_test_id
      AND creator_id = jessica_profile_id
    LIMIT 1;
    
    IF existing_catalog_item_id IS NOT NULL THEN
      -- Mise à jour
      UPDATE catalog_items
      SET
        title = 'Soft Skills – Profil 360',
        description = 'Évaluez 10 dimensions clés des soft skills (gestion du stress, communication, collaboration, créativité, leadership…) et obtenez un classement personnalisé.',
        short_description = 'Évaluation rapide de 10 dimensions de soft skills avec recommandations personnalisées.',
        price = COALESCE(NULLIF((SELECT price FROM tests WHERE id = jessica_test_id), 0), 15),
        is_free = false,
        category = 'Soft skills',
        thematique = 'Soft skills',
        target_audience = 'all',
        is_active = true,
        updated_at = NOW()
      WHERE id = existing_catalog_item_id;
      
      RAISE NOTICE 'Catalog item mis à jour pour Jessica';
    ELSE
      -- Insertion
      INSERT INTO catalog_items (
        item_type,
        content_id,
        title,
        description,
        short_description,
        price,
        is_free,
        currency,
        category,
        thematique,
        target_audience,
        is_active,
        is_featured,
        creator_id,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        'test',
        jessica_test_id,
        'Soft Skills – Profil 360',
        'Évaluez 10 dimensions clés des soft skills (gestion du stress, communication, collaboration, créativité, leadership…) et obtenez un classement personnalisé.',
        'Évaluation rapide de 10 dimensions de soft skills avec recommandations personnalisées.',
        15,
        false,
        'EUR',
        'Soft skills',
        'Soft skills',
        'all',
        true,
        false,
        jessica_profile_id,
        jessica_profile_id,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Catalog item créé pour Jessica';
    END IF;
  END;
  
  RAISE NOTICE '✅ Duplication terminée avec succès!';
  RAISE NOTICE 'Test ID Jessica: %', jessica_test_id;
  RAISE NOTICE 'Questionnaire ID Beyond Care: %', beyond_care_questionnaire_id;
  
END $$;


-- ============================================
-- Script pour ajouter plus de collaborateurs avec des données mock pour Beyond Care
-- ============================================

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_questionnaire_id UUID;
  v_question_id UUID;
  v_response_id UUID;
  v_assessment_id UUID;
  v_week_start DATE;
  v_stress_score NUMERIC;
  v_wellbeing_score NUMERIC;
  v_motivation_score NUMERIC;
  v_phone TEXT;
  v_email TEXT;
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_created_at TIMESTAMPTZ;
  v_week_offset INTEGER;
  v_week_end DATE;
BEGIN
  -- Récupérer l'organisation "Beyond Center Demo"
  SELECT id INTO v_org_id
  FROM organizations
  WHERE name = 'Beyond Center Demo'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Organisation "Beyond Center Demo" non trouvée. Veuillez d''abord exécuter le script create-bruce-wayne-beyond-care.js';
    RETURN;
  END IF;

  -- Liste des collaborateurs à créer
  DECLARE
    collaborators CURSOR FOR
    SELECT * FROM (VALUES
      ('marie.dupont@beyondcenter.fr', 'Marie', 'Dupont', '+33612345680', 65, 72, 68),
      ('pierre.martin@beyondcenter.fr', 'Pierre', 'Martin', '+33612345681', 45, 55, 50),
      ('sophie.bernard@beyondcenter.fr', 'Sophie', 'Bernard', '+33612345682', 75, 80, 78),
      ('lucas.dubois@beyondcenter.fr', 'Lucas', 'Dubois', '+33612345683', 35, 40, 38),
      ('emma.leroy@beyondcenter.fr', 'Emma', 'Leroy', '+33612345684', 58, 65, 62),
      ('thomas.moreau@beyondcenter.fr', 'Thomas', 'Moreau', '+33612345685', 42, 48, 45),
      ('laura.petit@beyondcenter.fr', 'Laura', 'Petit', '+33612345686', 70, 75, 73),
      ('antoine.garcia@beyondcenter.fr', 'Antoine', 'Garcia', '+33612345687', 50, 58, 55),
      ('julie.robert@beyondcenter.fr', 'Julie', 'Robert', '+33612345688', 68, 70, 69),
      ('nicolas.david@beyondcenter.fr', 'Nicolas', 'David', '+33612345689', 38, 42, 40)
    ) AS t(email, first_name, last_name, phone, stress, wellbeing, motivation);
  BEGIN
    FOR collab IN collaborators LOOP
      v_email := collab.email;
      v_first_name := collab.first_name;
      v_last_name := collab.last_name;
      v_full_name := v_first_name || ' ' || v_last_name;
      v_phone := collab.phone;
      v_stress_score := collab.stress;
      v_wellbeing_score := collab.wellbeing;
      v_motivation_score := collab.motivation;

      -- Vérifier si l'utilisateur existe déjà
      SELECT id INTO v_user_id
      FROM auth.users
      WHERE email = v_email
      LIMIT 1;

      IF v_user_id IS NULL THEN
        -- Créer l'utilisateur dans auth.users
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          created_at,
          updated_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          confirmation_token,
          recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          v_email,
          crypt('Demo123!@#', gen_salt('bf')),
          NOW(),
          NOW(),
          NOW(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('full_name', v_full_name, 'first_name', v_first_name, 'last_name', v_last_name),
          false,
          '',
          ''
        ) RETURNING id INTO v_user_id;

        -- Créer le profil (ou mettre à jour s'il existe déjà)
        INSERT INTO public.profiles (
          id,
          email,
          full_name,
          first_name,
          last_name,
          phone,
          role,
          created_at,
          updated_at
        ) VALUES (
          v_user_id,
          v_email,
          v_full_name,
          v_first_name,
          v_last_name,
          v_phone,
          'learner',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            updated_at = NOW();

        -- Ajouter à l'organisation
        INSERT INTO public.org_memberships (
          org_id,
          user_id,
          role
        ) VALUES (
          v_org_id,
          v_user_id,
          'learner'
        );

        RAISE NOTICE '✅ Utilisateur créé: % (%)', v_full_name, v_email;
      ELSE
        RAISE NOTICE '⚠️  Utilisateur existe déjà: % (%)', v_full_name, v_email;
        
        -- Mettre à jour le profil avec le téléphone si nécessaire
        UPDATE public.profiles
        SET phone = v_phone,
            full_name = v_full_name,
            first_name = v_first_name,
            last_name = v_last_name
        WHERE id = v_user_id;

        -- Vérifier l'appartenance à l'organisation (ou mettre à jour si elle existe)
        INSERT INTO public.org_memberships (
          org_id,
          user_id,
          role
        ) VALUES (
          v_org_id,
          v_user_id,
          'learner'
        )
        ON CONFLICT (org_id, user_id) DO UPDATE
        SET role = EXCLUDED.role;
      END IF;

      -- Récupérer le questionnaire hebdomadaire
      SELECT id INTO v_questionnaire_id
      FROM public.mental_health_questionnaires
      WHERE org_id = v_org_id
        AND frequency = 'weekly'
        AND is_active = true
      LIMIT 1;

      IF v_questionnaire_id IS NOT NULL THEN
        -- Créer des indicateurs pour les 4 dernières semaines
        FOR v_week_offset IN 0..3 LOOP
          v_week_start := DATE_TRUNC('week', CURRENT_DATE) - (v_week_offset * INTERVAL '1 week');
          
          -- Supprimer les indicateurs existants pour cette semaine
          DELETE FROM public.mental_health_indicators
          WHERE user_id = v_user_id
            AND week_start_date = v_week_start;

          -- Ajouter une variation aléatoire aux scores
          v_stress_score := GREATEST(0, LEAST(100, v_stress_score + (RANDOM() * 10 - 5)));
          v_wellbeing_score := GREATEST(0, LEAST(100, v_wellbeing_score + (RANDOM() * 10 - 5)));
          v_motivation_score := GREATEST(0, LEAST(100, v_motivation_score + (RANDOM() * 10 - 5)));

          -- Calculer la date de fin de semaine
          v_week_end := v_week_start + INTERVAL '6 days';

          -- Insérer les indicateurs
          INSERT INTO public.mental_health_indicators (
            user_id,
            org_id,
            indicator_type,
            indicator_value,
            week_start_date,
            week_end_date,
            created_at
          ) VALUES
          (v_user_id, v_org_id, 'stress', v_stress_score, v_week_start, v_week_end, NOW()),
          (v_user_id, v_org_id, 'wellbeing', v_wellbeing_score, v_week_start, v_week_end, NOW()),
          (v_user_id, v_org_id, 'motivation', v_motivation_score, v_week_start, v_week_end, NOW())
          ON CONFLICT (user_id, indicator_type, week_start_date) DO UPDATE
          SET indicator_value = EXCLUDED.indicator_value,
              week_end_date = EXCLUDED.week_end_date;
        END LOOP;

        RAISE NOTICE '   ✅ Indicateurs créés pour %', v_full_name;
      END IF;
    END LOOP;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Tous les collaborateurs ont été créés/mis à jour avec succès!';
END $$;


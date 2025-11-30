-- ============================================
-- Script pour ajouter des candidats mock avec photos
-- ============================================

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_experience_id UUID;
  v_education_id UUID;
  v_skill_id UUID;
  v_language_id UUID;
  v_test_attempt_id UUID;
  v_candidate_rec RECORD;
  v_test_id UUID;
  v_has_category_results BOOLEAN;
  v_has_status BOOLEAN;
BEGIN
  -- Ajouter la colonne birth_date si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
    RAISE NOTICE 'Colonne birth_date ajoutée à la table profiles';
  END IF;

  -- Vérifier la structure de test_attempts une seule fois
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'test_attempts' AND column_name = 'category_results'
  ) INTO v_has_category_results;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'test_attempts' AND column_name = 'status'
  ) INTO v_has_status;

  -- Récupérer l'organisation "Beyond Center Demo"
  SELECT id INTO v_org_id
  FROM organizations
  WHERE name = 'Beyond Center Demo'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Organisation "Beyond Center Demo" non trouvée.';
    RETURN;
  END IF;

  -- Liste des candidats à créer avec leurs photos
  FOR v_candidate_rec IN
    SELECT * FROM (VALUES
      ('Sophie', 'Martin', 'sophie.martin@example.com', '06 12 34 56 78', '1995-03-15'::DATE, 'Paris', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', ARRAY['JavaScript', 'React', 'Node.js', 'TypeScript'], 'Développeuse Full Stack', 'TechStart', '2020-06-01'::DATE, '2023-12-31'::DATE),
      ('Lucas', 'Dubois', 'lucas.dubois@example.com', '06 23 45 67 89', '1998-07-22'::DATE, 'Lyon', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', ARRAY['Python', 'Django', 'PostgreSQL', 'Docker'], 'Développeur Backend', 'DataCorp', '2021-09-01'::DATE, NULL),
      ('Emma', 'Bernard', 'emma.bernard@example.com', '06 34 56 78 90', '1996-11-08'::DATE, 'Marseille', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', ARRAY['Marketing Digital', 'SEO', 'Google Ads', 'Analytics'], 'Chef de Projet Marketing', 'DigitalAgency', '2019-03-01'::DATE, '2022-08-31'::DATE),
      ('Thomas', 'Leroy', 'thomas.leroy@example.com', '06 45 67 89 01', '1997-02-14'::DATE, 'Toulouse', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', ARRAY['Java', 'Spring Boot', 'Microservices', 'Kubernetes'], 'Ingénieur DevOps', 'CloudTech', '2020-01-15'::DATE, NULL),
      ('Marie', 'Petit', 'marie.petit@example.com', '06 56 78 90 12', '1999-05-30'::DATE, 'Nantes', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', ARRAY['UI/UX Design', 'Figma', 'Adobe XD', 'Prototyping'], 'Designer UX/UI', 'DesignStudio', '2021-06-01'::DATE, NULL),
      ('Alexandre', 'Moreau', 'alexandre.moreau@example.com', '06 67 89 01 23', '1994-09-18'::DATE, 'Bordeaux', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', ARRAY['Data Science', 'Python', 'Machine Learning', 'TensorFlow'], 'Data Scientist', 'AICorp', '2018-09-01'::DATE, NULL),
      ('Julie', 'Garcia', 'julie.garcia@example.com', '06 78 90 12 34', '1996-12-25'::DATE, 'Lille', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', ARRAY['Product Management', 'Agile', 'Scrum', 'Jira'], 'Product Manager', 'ProductLab', '2020-03-01'::DATE, NULL),
      ('Nicolas', 'Roux', 'nicolas.roux@example.com', '06 89 01 23 45', '1995-08-10'::DATE, 'Strasbourg', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', ARRAY['Sales', 'CRM', 'Negotiation', 'Business Development'], 'Business Developer', 'SalesForce', '2019-11-01'::DATE, NULL),
      ('Camille', 'Simon', 'camille.simon@example.com', '06 90 12 34 56', '1997-04-05'::DATE, 'Nice', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', ARRAY['Content Marketing', 'Copywriting', 'Social Media', 'SEO'], 'Content Manager', 'ContentAgency', '2021-01-15'::DATE, NULL),
      ('Antoine', 'Laurent', 'antoine.laurent@example.com', '06 01 23 45 67', '1998-10-20'::DATE, 'Rennes', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', ARRAY['Mobile Development', 'React Native', 'iOS', 'Android'], 'Développeur Mobile', 'MobileApp', '2020-09-01'::DATE, NULL)
    ) AS t(first_name, last_name, email, phone, birth_date, location, avatar_url, skills, job_title, company, start_date, end_date)
  LOOP
    -- Vérifier si l'utilisateur existe déjà
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_candidate_rec.email
    LIMIT 1;

    -- Si l'utilisateur n'existe pas, le créer dans auth.users
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
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_candidate_rec.email,
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('email', v_candidate_rec.email, 'full_name', v_candidate_rec.first_name || ' ' || v_candidate_rec.last_name),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      )
      RETURNING id INTO v_user_id;
    END IF;

    -- Créer ou mettre à jour le profil
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      full_name,
      phone,
      birth_date,
      avatar_url,
      role,
      created_at
    ) VALUES (
      v_user_id,
      v_candidate_rec.email,
      v_candidate_rec.first_name,
      v_candidate_rec.last_name,
      v_candidate_rec.first_name || ' ' || v_candidate_rec.last_name,
      v_candidate_rec.phone,
      v_candidate_rec.birth_date,
      v_candidate_rec.avatar_url,
      'learner',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      birth_date = EXCLUDED.birth_date,
      avatar_url = EXCLUDED.avatar_url;

    -- Ajouter une expérience professionnelle
    INSERT INTO public.beyond_connect_experiences (
      user_id,
      title,
      company,
      location,
      start_date,
      end_date,
      is_current,
      description,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_candidate_rec.job_title,
      v_candidate_rec.company,
      v_candidate_rec.location,
      v_candidate_rec.start_date,
      v_candidate_rec.end_date,
      CASE WHEN v_candidate_rec.end_date IS NULL THEN true ELSE false END,
      'Expérience professionnelle dans le domaine.',
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_experience_id;

    -- Ajouter une formation
    INSERT INTO public.beyond_connect_education (
      user_id,
      degree,
      institution,
      field_of_study,
      start_date,
      end_date,
      is_current,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'Bac+5',
      'Université de ' || v_candidate_rec.location,
      'Informatique / Marketing / Business',
      (v_candidate_rec.birth_date + INTERVAL '18 years')::DATE,
      (v_candidate_rec.birth_date + INTERVAL '23 years')::DATE,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_education_id;

    -- Ajouter les compétences
    FOR i IN 1..array_length(v_candidate_rec.skills, 1)
    LOOP
      INSERT INTO public.beyond_connect_skills (
        user_id,
        name,
        category,
        level,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        v_candidate_rec.skills[i],
        CASE 
          WHEN v_candidate_rec.skills[i] IN ('JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'Django', 'Java', 'Spring Boot') THEN 'technique'
          WHEN v_candidate_rec.skills[i] IN ('Marketing Digital', 'SEO', 'Content Marketing', 'Sales') THEN 'business'
          ELSE 'autre'
        END,
        CASE (random() * 3)::int
          WHEN 0 THEN 'débutant'
          WHEN 1 THEN 'intermédiaire'
          ELSE 'avancé'
        END,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, name) DO NOTHING
      RETURNING id INTO v_skill_id;
    END LOOP;

    -- Ajouter une langue
    INSERT INTO public.beyond_connect_languages (
      user_id,
      language,
      level,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'Anglais',
      CASE (random() * 3)::int
        WHEN 0 THEN 'Débutant'
        WHEN 1 THEN 'Intermédiaire'
        ELSE 'Avancé'
      END,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_language_id;

    -- Ajouter un résultat de test soft skills (pour avoir des soft skills dans l'admin)
    -- Récupérer un test soft skills
    SELECT id INTO v_test_id
    FROM public.tests t
    WHERE t.title ILIKE '%soft%skill%' OR t.title ILIKE '%savoir-être%'
    LIMIT 1;
    
    IF v_test_id IS NOT NULL AND v_has_category_results THEN
      -- Structure avec category_results
      IF v_has_status THEN
        INSERT INTO public.test_attempts (
          user_id,
          test_id,
          status,
          completed_at,
          category_results,
          total_score,
          max_score,
          percentage,
          created_at,
          updated_at
        ) VALUES (
          v_user_id,
          v_test_id,
          'passed',
          NOW(),
          jsonb_build_array(
            jsonb_build_object('dimension', 'communication_influence', 'percentage', (50 + random() * 50)::int),
            jsonb_build_object('dimension', 'perseverance_action', 'percentage', (50 + random() * 50)::int),
            jsonb_build_object('dimension', 'organisation_priorites', 'percentage', (50 + random() * 50)::int),
            jsonb_build_object('dimension', 'creativite_adaptabilite', 'percentage', (50 + random() * 50)::int)
          ),
          75.0,
          100.0,
          75.0,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_test_attempt_id;
      ELSE
        -- Sans status
        INSERT INTO public.test_attempts (
          user_id,
          test_id,
          completed_at,
          category_results,
          total_score,
          max_score,
          percentage,
          created_at,
          updated_at
        ) VALUES (
          v_user_id,
          v_test_id,
          NOW(),
          jsonb_build_array(
            jsonb_build_object('dimension', 'communication_influence', 'percentage', (50 + random() * 50)::int),
            jsonb_build_object('dimension', 'perseverance_action', 'percentage', (50 + random() * 50)::int),
            jsonb_build_object('dimension', 'organisation_priorites', 'percentage', (50 + random() * 50)::int),
            jsonb_build_object('dimension', 'creativite_adaptabilite', 'percentage', (50 + random() * 50)::int)
          ),
          75.0,
          100.0,
          75.0,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_test_attempt_id;
      END IF;
    END IF;

    RAISE NOTICE 'Candidat créé: % % (%)', v_candidate_rec.first_name, v_candidate_rec.last_name, v_candidate_rec.email;
  END LOOP;

  RAISE NOTICE 'Tous les candidats mock ont été créés avec succès!';
END $$;


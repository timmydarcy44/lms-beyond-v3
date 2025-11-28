-- ============================================
-- Script pour créer des données mock pour Beyond Connect
-- Côté apprenant (candidats) et côté admin (entreprises)
-- ============================================

DO $$
DECLARE
  v_org_id UUID;
  v_company_id UUID;
  v_company2_id UUID;
  v_user_id UUID;
  v_admin_id UUID;
  v_job_offer_id UUID;
  v_job_offer2_id UUID;
  v_job_offer3_id UUID;
  v_application_id UUID;
  v_experience_id UUID;
  v_education_id UUID;
  v_skill_id UUID;
  v_certification_id UUID;
  v_project_id UUID;
  v_language_id UUID;
  v_match_id UUID;
  v_cv_library_id UUID;
  v_email TEXT;
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
  v_start_date DATE;
  v_end_date DATE;
  v_created_at TIMESTAMPTZ;
  v_alex_id UUID;
  v_sarah_id UUID;
  v_thomas_id UUID;
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

  -- ============================================
  -- 1. CRÉER DES ENTREPRISES
  -- ============================================
  
  -- Entreprise 1: TechCorp
  INSERT INTO public.beyond_connect_companies (
    organization_id,
    name,
    description,
    industry,
    size,
    website,
    is_premium,
    created_at,
    updated_at
  ) VALUES (
    v_org_id,
    'TechCorp Solutions',
    'Entreprise spécialisée dans le développement de solutions digitales innovantes. Nous recherchons des talents passionnés par la technologie.',
    'Technologie',
    'pme',
    'https://techcorp-solutions.fr',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_company_id;

  -- Si l'entreprise existe déjà, la récupérer
  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id
    FROM public.beyond_connect_companies
    WHERE name = 'TechCorp Solutions'
    LIMIT 1;
  END IF;

  -- Entreprise 2: InnovateLab
  INSERT INTO public.beyond_connect_companies (
    organization_id,
    name,
    description,
    industry,
    size,
    website,
    is_premium,
    created_at,
    updated_at
  ) VALUES (
    v_org_id,
    'InnovateLab',
    'Startup innovante dans le domaine de l''intelligence artificielle et du machine learning.',
    'Intelligence Artificielle',
    'startup',
    'https://innovatelab.io',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_company2_id;

  -- ============================================
  -- 2. CRÉER UN ADMIN POUR TECH CORP
  -- ============================================
  
  v_email := 'recruteur@techcorp.fr';
  v_first_name := 'Sophie';
  v_last_name := 'Martin';
  v_full_name := v_first_name || ' ' || v_last_name;
  v_phone := '+33612345690';

  -- Vérifier si l'admin existe
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    -- Créer l'admin
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
    ) RETURNING id INTO v_admin_id;

    -- Créer le profil
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
      v_admin_id,
      v_email,
      v_full_name,
      v_first_name,
      v_last_name,
      v_phone,
      'admin',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone;

    -- Ajouter à l'organisation
    INSERT INTO public.org_memberships (
      org_id,
      user_id,
      role
    ) VALUES (
      v_org_id,
      v_admin_id,
      'admin'
    )
    ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;
  END IF;

  -- ============================================
  -- 3. CRÉER DES CANDIDATS (APPRENANTS) AVEC CV COMPLETS
  -- ============================================
  
  -- Candidat 1: Alex Dupont
  v_email := 'alex.dupont@beyondcenter.fr';
  v_first_name := 'Alex';
  v_last_name := 'Dupont';
  v_full_name := v_first_name || ' ' || v_last_name;
  v_phone := '+33612345691';

  SELECT id INTO v_alex_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_alex_id IS NULL THEN
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
    ) RETURNING id INTO v_alex_id;

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
      v_alex_id,
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
        phone = EXCLUDED.phone;

    INSERT INTO public.org_memberships (
      org_id,
      user_id,
      role
    ) VALUES (
      v_org_id,
      v_alex_id,
      'learner'
    )
    ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;
  END IF;

  -- Expérience pour Alex
  INSERT INTO public.beyond_connect_experiences (
    user_id,
    title,
    company,
    description,
    start_date,
    end_date,
    is_current,
    location,
    created_at,
    updated_at
  ) VALUES (
    v_alex_id,
    'Développeur Full Stack',
    'TechCorp',
    'Développement d''applications web et mobiles avec React, Node.js et PostgreSQL. Participation à l''architecture technique et aux code reviews.',
    '2022-01-15'::DATE,
    NULL,
    true,
    'Paris',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Formation pour Alex
  INSERT INTO public.beyond_connect_education (
    user_id,
    degree,
    institution,
    field_of_study,
    description,
    start_date,
    end_date,
    is_current,
    grade,
    created_at,
    updated_at
  ) VALUES (
    v_alex_id,
    'Master Informatique',
    'École Polytechnique',
    'Informatique',
    'Formation complète en développement logiciel et architecture système.',
    '2020-09-01'::DATE,
    '2022-06-30'::DATE,
    false,
    'Mention Très Bien',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Compétences pour Alex
  INSERT INTO public.beyond_connect_skills (user_id, name, category, level, created_at, updated_at) VALUES
  (v_alex_id, 'JavaScript', 'technique', 'Avancé', NOW(), NOW()),
  (v_alex_id, 'React', 'technique', 'Avancé', NOW(), NOW()),
  (v_alex_id, 'Node.js', 'technique', 'Avancé', NOW(), NOW()),
  (v_alex_id, 'Python', 'technique', 'Intermédiaire', NOW(), NOW())
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Certifications pour Alex
  INSERT INTO public.beyond_connect_certifications (
    user_id,
    name,
    issuer,
    issue_date,
    expiry_date,
    credential_id,
    credential_url,
    created_at,
    updated_at
  ) VALUES
  (v_alex_id, 'Certification AWS', 'Amazon Web Services', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '18 months', 'CERT-AWS-001', 'https://example.com/cert/aws', NOW(), NOW()),
  (v_alex_id, 'Certification Google Cloud', 'Google', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '21 months', 'CERT-GCP-001', 'https://example.com/cert/gcp', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Projets pour Alex
  INSERT INTO public.beyond_connect_projects (
    user_id,
    title,
    description,
    technologies,
    url,
    start_date,
    end_date,
    created_at,
    updated_at
  ) VALUES
  (v_alex_id, 'Projet E-commerce', 'Plateforme e-commerce complète avec gestion de panier, paiement et administration.', ARRAY['React', 'Node.js', 'PostgreSQL'], 'https://github.com/user/ecommerce', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '1 month', NOW(), NOW()),
  (v_alex_id, 'Application Mobile', 'Application mobile cross-platform pour la gestion de tâches.', ARRAY['React Native', 'Firebase'], 'https://github.com/user/mobile-app', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '2 months', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Langues pour Alex
  INSERT INTO public.beyond_connect_languages (user_id, language, level, created_at, updated_at) VALUES
  (v_alex_id, 'Anglais', 'C1', NOW(), NOW()),
  (v_alex_id, 'Espagnol', 'B2', NOW(), NOW())
  ON CONFLICT (user_id, language) DO NOTHING;

  RAISE NOTICE '✅ Candidat créé: Alex Dupont (%)', v_email;

  -- Candidat 2: Sarah Bernard
  v_email := 'sarah.bernard@beyondcenter.fr';
  v_first_name := 'Sarah';
  v_last_name := 'Bernard';
  v_full_name := v_first_name || ' ' || v_last_name;
  v_phone := '+33612345692';

  SELECT id INTO v_sarah_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_sarah_id IS NULL THEN
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
    ) RETURNING id INTO v_sarah_id;

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
      v_sarah_id,
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
        phone = EXCLUDED.phone;

    INSERT INTO public.org_memberships (
      org_id,
      user_id,
      role
    ) VALUES (
      v_org_id,
      v_sarah_id,
      'learner'
    )
    ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;
  END IF;

  -- Expérience pour Sarah
  INSERT INTO public.beyond_connect_experiences (
    user_id,
    title,
    company,
    description,
    start_date,
    end_date,
    is_current,
    location,
    created_at,
    updated_at
  ) VALUES (
    v_sarah_id,
    'Chef de Projet Digital',
    'Digital Agency',
    'Gestion de projets digitaux de A à Z, coordination des équipes techniques et créatives, suivi budgétaire et temporel.',
    '2021-03-01'::DATE,
    NULL,
    true,
    'Lyon',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Formation pour Sarah
  INSERT INTO public.beyond_connect_education (
    user_id,
    degree,
    institution,
    field_of_study,
    description,
    start_date,
    end_date,
    is_current,
    grade,
    created_at,
    updated_at
  ) VALUES (
    v_sarah_id,
    'Master Marketing Digital',
    'HEC Paris',
    'Marketing',
    'Formation en marketing digital, gestion de projet et stratégie digitale.',
    '2019-09-01'::DATE,
    '2021-06-30'::DATE,
    false,
    'Mention Bien',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Compétences pour Sarah
  INSERT INTO public.beyond_connect_skills (user_id, name, category, level, created_at, updated_at) VALUES
  (v_sarah_id, 'Project Management', 'technique', 'Expert', NOW(), NOW()),
  (v_sarah_id, 'Agile', 'technique', 'Expert', NOW(), NOW()),
  (v_sarah_id, 'Scrum', 'technique', 'Avancé', NOW(), NOW()),
  (v_sarah_id, 'Marketing Digital', 'technique', 'Avancé', NOW(), NOW())
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Certifications pour Sarah
  INSERT INTO public.beyond_connect_certifications (
    user_id,
    name,
    issuer,
    issue_date,
    expiry_date,
    credential_id,
    credential_url,
    created_at,
    updated_at
  ) VALUES
  (v_sarah_id, 'Certification PMP', 'PMI', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '2 years', 'CERT-PMP-001', 'https://example.com/cert/pmp', NOW(), NOW()),
  (v_sarah_id, 'Certification Google Analytics', 'Google', CURRENT_DATE - INTERVAL '6 months', NULL, 'CERT-GA-001', 'https://example.com/cert/ga', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Projets pour Sarah
  INSERT INTO public.beyond_connect_projects (
    user_id,
    title,
    description,
    technologies,
    url,
    start_date,
    end_date,
    created_at,
    updated_at
  ) VALUES
  (v_sarah_id, 'Lancement Produit', 'Lancement d''un nouveau produit digital avec stratégie marketing complète.', ARRAY['Marketing', 'Stratégie'], 'https://example.com/project1', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE - INTERVAL '1 month', NOW(), NOW()),
  (v_sarah_id, 'Campagne Marketing', 'Campagne marketing digitale multi-canal avec ROI de 300%.', ARRAY['Marketing Digital', 'Analytics'], 'https://example.com/project2', CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE - INTERVAL '3 months', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Langues pour Sarah
  INSERT INTO public.beyond_connect_languages (user_id, language, level, created_at, updated_at) VALUES
  (v_sarah_id, 'Anglais', 'C2', NOW(), NOW()),
  (v_sarah_id, 'Allemand', 'B1', NOW(), NOW())
  ON CONFLICT (user_id, language) DO NOTHING;

  RAISE NOTICE '✅ Candidat créé: Sarah Bernard (%)', v_email;

  -- Candidat 3: Thomas Leroy
  v_email := 'thomas.leroy@beyondcenter.fr';
  v_first_name := 'Thomas';
  v_last_name := 'Leroy';
  v_full_name := v_first_name || ' ' || v_last_name;
  v_phone := '+33612345693';

  SELECT id INTO v_thomas_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_thomas_id IS NULL THEN
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
    ) RETURNING id INTO v_thomas_id;

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
      v_thomas_id,
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
        phone = EXCLUDED.phone;

    INSERT INTO public.org_memberships (
      org_id,
      user_id,
      role
    ) VALUES (
      v_org_id,
      v_thomas_id,
      'learner'
    )
    ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;
  END IF;

  -- Expérience pour Thomas
  INSERT INTO public.beyond_connect_experiences (
    user_id,
    title,
    company,
    description,
    start_date,
    end_date,
    is_current,
    location,
    created_at,
    updated_at
  ) VALUES (
    v_thomas_id,
    'Data Analyst',
    'DataCorp',
    'Analyse de données, création de dashboards et modèles prédictifs pour aider à la prise de décision.',
    '2023-06-01'::DATE,
    NULL,
    true,
    'Toulouse',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Formation pour Thomas
  INSERT INTO public.beyond_connect_education (
    user_id,
    degree,
    institution,
    field_of_study,
    description,
    start_date,
    end_date,
    is_current,
    grade,
    created_at,
    updated_at
  ) VALUES (
    v_thomas_id,
    'Master Data Science',
    'Université Toulouse',
    'Data Science',
    'Formation en data science, machine learning et analyse de données.',
    '2021-09-01'::DATE,
    '2023-06-30'::DATE,
    false,
    'Mention Très Bien',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Compétences pour Thomas
  INSERT INTO public.beyond_connect_skills (user_id, name, category, level, created_at, updated_at) VALUES
  (v_thomas_id, 'Python', 'technique', 'Avancé', NOW(), NOW()),
  (v_thomas_id, 'SQL', 'technique', 'Expert', NOW(), NOW()),
  (v_thomas_id, 'Tableau', 'technique', 'Avancé', NOW(), NOW()),
  (v_thomas_id, 'Machine Learning', 'technique', 'Intermédiaire', NOW(), NOW())
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Certifications pour Thomas
  INSERT INTO public.beyond_connect_certifications (
    user_id,
    name,
    issuer,
    issue_date,
    expiry_date,
    credential_id,
    credential_url,
    created_at,
    updated_at
  ) VALUES
  (v_thomas_id, 'Certification Tableau', 'Tableau Software', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '20 months', 'CERT-TAB-001', 'https://example.com/cert/tableau', NOW(), NOW()),
  (v_thomas_id, 'Certification Databricks', 'Databricks', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '22 months', 'CERT-DB-001', 'https://example.com/cert/databricks', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Projets pour Thomas
  INSERT INTO public.beyond_connect_projects (
    user_id,
    title,
    description,
    technologies,
    url,
    start_date,
    end_date,
    created_at,
    updated_at
  ) VALUES
  (v_thomas_id, 'Analyse Prédictive', 'Modèle prédictif pour prévoir les ventes avec une précision de 85%.', ARRAY['Python', 'Machine Learning', 'Pandas'], 'https://github.com/user/predictive', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE - INTERVAL '2 months', NOW(), NOW()),
  (v_thomas_id, 'Dashboard Analytics', 'Dashboard interactif pour visualiser les KPIs en temps réel.', ARRAY['Tableau', 'SQL', 'Python'], 'https://example.com/dashboard', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '1 month', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Langues pour Thomas
  INSERT INTO public.beyond_connect_languages (user_id, language, level, created_at, updated_at) VALUES
  (v_thomas_id, 'Anglais', 'C1', NOW(), NOW())
  ON CONFLICT (user_id, language) DO NOTHING;

  RAISE NOTICE '✅ Candidat créé: Thomas Leroy (%)', v_email;

  -- ============================================
  -- 4. CRÉER DES OFFRES D'EMPLOI
  -- ============================================
  
  IF v_company_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
    -- Offre 1: Développeur Full Stack
    INSERT INTO public.beyond_connect_job_offers (
      company_id,
      created_by,
      title,
      description,
      company_presentation,
      contract_type,
      location,
      remote_allowed,
      salary_min,
      salary_max,
      currency,
      hours_per_week,
      required_skills,
      required_soft_skills,
      required_experience,
      required_education,
      benefits,
      application_deadline,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_company_id,
      v_admin_id,
      'Développeur Full Stack Senior',
      'Nous recherchons un développeur full stack expérimenté pour rejoindre notre équipe technique. Vous serez en charge du développement de nouvelles fonctionnalités et de la maintenance de nos applications web et mobiles.

**Missions principales :**
- Développer des fonctionnalités frontend et backend
- Participer à l''architecture technique
- Collaborer avec les équipes produit et design
- Assurer la qualité du code et les tests

**Profil recherché :**
- Minimum 3 ans d''expérience en développement web
- Maîtrise de JavaScript, React, Node.js
- Connaissance de bases de données (PostgreSQL, MongoDB)
- Expérience avec les API REST et GraphQL',
      'TechCorp Solutions est une entreprise innovante spécialisée dans le développement de solutions digitales. Nous accompagnons nos clients dans leur transformation numérique avec des équipes passionnées et expertes.',
      'cdi',
      'Paris',
      true,
      45000,
      60000,
      'EUR',
      35,
      ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      ARRAY['communication', 'adaptabilite', 'leadership_vision'],
      'mid',
      'bac+3',
      ARRAY['Télétravail flexible', 'Mutuelle', 'Tickets restaurant', 'Formation continue'],
      CURRENT_DATE + INTERVAL '30 days',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_job_offer_id;

    -- Offre 2: Chef de Projet Digital
    INSERT INTO public.beyond_connect_job_offers (
      company_id,
      created_by,
      title,
      description,
      company_presentation,
      contract_type,
      location,
      remote_allowed,
      salary_min,
      salary_max,
      currency,
      hours_per_week,
      required_skills,
      required_soft_skills,
      required_experience,
      required_education,
      benefits,
      application_deadline,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_company_id,
      v_admin_id,
      'Chef de Projet Digital',
      'Rejoignez notre équipe en tant que Chef de Projet Digital. Vous serez responsable de la gestion de projets digitaux de A à Z, de la conception à la livraison.

**Missions principales :**
- Gérer plusieurs projets digitaux simultanément
- Coordonner les équipes techniques et créatives
- Assurer le suivi budgétaire et temporel
- Communiquer avec les clients et les parties prenantes

**Profil recherché :**
- Minimum 2 ans d''expérience en gestion de projet
- Maîtrise des méthodologies Agile/Scrum
- Excellente communication et organisation
- Connaissance du marketing digital',
      'TechCorp Solutions est une entreprise innovante spécialisée dans le développement de solutions digitales.',
      'cdi',
      'Paris',
      true,
      40000,
      55000,
      'EUR',
      35,
      ARRAY['Project Management', 'Agile', 'Scrum', 'Marketing Digital'],
      ARRAY['communication', 'organisation_priorites', 'leadership_vision'],
      'mid',
      'bac+3',
      ARRAY['Télétravail flexible', 'Mutuelle', 'Tickets restaurant'],
      CURRENT_DATE + INTERVAL '45 days',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_job_offer2_id;

    -- Offre 3: Stage Développeur
    INSERT INTO public.beyond_connect_job_offers (
      company_id,
      created_by,
      title,
      description,
      company_presentation,
      contract_type,
      location,
      remote_allowed,
      salary_min,
      salary_max,
      currency,
      hours_per_week,
      required_skills,
      required_soft_skills,
      required_experience,
      required_education,
      benefits,
      application_deadline,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_company_id,
      v_admin_id,
      'Stage Développeur Web',
      'Stage de 6 mois pour un étudiant en informatique. Vous participerez au développement de nos applications web et apprendrez les meilleures pratiques du développement moderne.

**Missions principales :**
- Développer des fonctionnalités frontend
- Participer aux code reviews
- Apprendre les technologies modernes
- Collaborer avec l''équipe technique

**Profil recherché :**
- Étudiant en dernière année d''école d''ingénieur ou master
- Connaissances en JavaScript, React
- Motivation et envie d''apprendre',
      'TechCorp Solutions est une entreprise innovante spécialisée dans le développement de solutions digitales.',
      'stage',
      'Paris',
      false,
      1000,
      1200,
      'EUR',
      35,
      ARRAY['JavaScript', 'React', 'HTML', 'CSS'],
      ARRAY['adaptabilite', 'creativite_adaptabilite'],
      'junior',
      'bac+3',
      ARRAY['Tickets restaurant', 'Formation'],
      CURRENT_DATE + INTERVAL '20 days',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_job_offer3_id;

    RAISE NOTICE '✅ Offres d''emploi créées pour TechCorp';
  END IF;

  -- ============================================
  -- 5. CRÉER DES CANDIDATURES
  -- ============================================
  
  IF v_job_offer_id IS NOT NULL AND v_alex_id IS NOT NULL THEN
    -- Alex candidature pour Développeur Full Stack
    INSERT INTO public.beyond_connect_applications (
      job_offer_id,
      user_id,
      cover_letter,
      status,
      match_score,
      created_at,
      updated_at
    ) VALUES (
      v_job_offer_id,
      v_alex_id,
      'Je suis très intéressé par cette opportunité de développeur full stack. Avec mon expérience de 2 ans chez TechCorp et ma maîtrise de React, Node.js et PostgreSQL, je pense que mon profil correspond parfaitement à vos attentes. Je serais ravi de contribuer à vos projets innovants.',
      'reviewed',
      85.5,
      NOW() - INTERVAL '5 days',
      NOW()
    )
    ON CONFLICT (job_offer_id, user_id) DO NOTHING;
  END IF;

  IF v_job_offer2_id IS NOT NULL AND v_sarah_id IS NOT NULL THEN
    -- Sarah candidature pour Chef de Projet
    INSERT INTO public.beyond_connect_applications (
      job_offer_id,
      user_id,
      cover_letter,
      status,
      match_score,
      created_at,
      updated_at
    ) VALUES (
      v_job_offer2_id,
      v_sarah_id,
      'En tant que Chef de Projet Digital avec plus de 3 ans d''expérience, je serais ravi de rejoindre votre équipe. Ma maîtrise d''Agile et Scrum ainsi que mon expérience en marketing digital font de moi un candidat idéal pour ce poste.',
      'interview',
      92.0,
      NOW() - INTERVAL '3 days',
      NOW()
    )
    ON CONFLICT (job_offer_id, user_id) DO NOTHING;
  END IF;

  IF v_job_offer_id IS NOT NULL AND v_thomas_id IS NOT NULL THEN
    -- Thomas candidature pour Développeur Full Stack
    INSERT INTO public.beyond_connect_applications (
      job_offer_id,
      user_id,
      cover_letter,
      status,
      match_score,
      created_at,
      updated_at
    ) VALUES (
      v_job_offer_id,
      v_thomas_id,
      'Bien que mon expérience principale soit en data science, j''ai également des compétences solides en développement web avec Python et SQL. Je serais intéressé par cette opportunité pour élargir mes compétences.',
      'pending',
      72.5,
      NOW() - INTERVAL '1 day',
      NOW()
    )
    ON CONFLICT (job_offer_id, user_id) DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Candidatures créées';

  -- ============================================
  -- 6. CRÉER DES MATCHINGS (PREMIUM)
  -- ============================================
  
  IF v_company_id IS NOT NULL AND v_job_offer_id IS NOT NULL AND v_alex_id IS NOT NULL THEN
    -- Vérifier si le matching existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM public.beyond_connect_matches
      WHERE company_id = v_company_id
        AND job_offer_id = v_job_offer_id
        AND user_id = v_alex_id
    ) THEN
      INSERT INTO public.beyond_connect_matches (
        company_id,
        job_offer_id,
        user_id,
        match_score,
        skills_match,
        experience_match,
        education_match,
        details,
        created_at,
        updated_at
      ) VALUES (
        v_company_id,
        v_job_offer_id,
        v_alex_id,
        88.5,
        90.0,
        85.0,
        90.0,
        jsonb_build_object(
          'match_reason', 'Profil très compatible avec les exigences du poste. Compétences techniques parfaitement alignées (React, Node.js, PostgreSQL) et soft skills développées.',
          'soft_skills_match', 90.0
        ),
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  IF v_company_id IS NOT NULL AND v_job_offer2_id IS NOT NULL AND v_sarah_id IS NOT NULL THEN
    -- Vérifier si le matching existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM public.beyond_connect_matches
      WHERE company_id = v_company_id
        AND job_offer_id = v_job_offer2_id
        AND user_id = v_sarah_id
    ) THEN
      INSERT INTO public.beyond_connect_matches (
        company_id,
        job_offer_id,
        user_id,
        match_score,
        skills_match,
        experience_match,
        education_match,
        details,
        created_at,
        updated_at
      ) VALUES (
        v_company_id,
        v_job_offer2_id,
        v_sarah_id,
        95.0,
        95.0,
        95.0,
        95.0,
        jsonb_build_object(
          'match_reason', 'Profil exceptionnel. Expérience parfaite en gestion de projet digital, maîtrise d''Agile/Scrum et excellentes compétences en communication.',
          'soft_skills_match', 95.0
        ),
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  -- Matching supplémentaire: Thomas pour Développeur Full Stack
  IF v_company_id IS NOT NULL AND v_job_offer_id IS NOT NULL AND v_thomas_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.beyond_connect_matches
      WHERE company_id = v_company_id
        AND job_offer_id = v_job_offer_id
        AND user_id = v_thomas_id
    ) THEN
      INSERT INTO public.beyond_connect_matches (
        company_id,
        job_offer_id,
        user_id,
        match_score,
        skills_match,
        experience_match,
        education_match,
        details,
        created_at,
        updated_at
      ) VALUES (
        v_company_id,
        v_job_offer_id,
        v_thomas_id,
        85.0,
        80.0,
        85.0,
        90.0,
        jsonb_build_object(
          'match_reason', 'Profil intéressant avec des compétences en data science et développement. Potentiel pour élargir ses compétences vers le full stack.',
          'soft_skills_match', 85.0
        ),
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  -- Matching supplémentaire: Alex pour Chef de Projet (bon profil technique)
  IF v_company_id IS NOT NULL AND v_job_offer2_id IS NOT NULL AND v_alex_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.beyond_connect_matches
      WHERE company_id = v_company_id
        AND job_offer_id = v_job_offer2_id
        AND user_id = v_alex_id
    ) THEN
      INSERT INTO public.beyond_connect_matches (
        company_id,
        job_offer_id,
        user_id,
        match_score,
        skills_match,
        experience_match,
        education_match,
        details,
        created_at,
        updated_at
      ) VALUES (
        v_company_id,
        v_job_offer2_id,
        v_alex_id,
        83.0,
        75.0,
        80.0,
        90.0,
        jsonb_build_object(
          'match_reason', 'Profil technique solide avec potentiel pour évoluer vers la gestion de projet. Bonne compréhension des enjeux techniques.',
          'soft_skills_match', 85.0
        ),
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  -- Matching supplémentaire: Sarah pour Stage Développeur (surqualifiée mais intéressante)
  IF v_company_id IS NOT NULL AND v_job_offer3_id IS NOT NULL AND v_sarah_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.beyond_connect_matches
      WHERE company_id = v_company_id
        AND job_offer_id = v_job_offer3_id
        AND user_id = v_sarah_id
    ) THEN
      INSERT INTO public.beyond_connect_matches (
        company_id,
        job_offer_id,
        user_id,
        match_score,
        skills_match,
        experience_match,
        education_match,
        details,
        created_at,
        updated_at
      ) VALUES (
        v_company_id,
        v_job_offer3_id,
        v_sarah_id,
        80.0,
        70.0,
        90.0,
        85.0,
        jsonb_build_object(
          'match_reason', 'Profil surqualifié mais très intéressant. Excellente expérience en gestion de projet qui pourrait être un atout pour un stage.',
          'soft_skills_match', 90.0
        ),
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  -- Matching supplémentaire: Thomas pour Stage Développeur
  IF v_company_id IS NOT NULL AND v_job_offer3_id IS NOT NULL AND v_thomas_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.beyond_connect_matches
      WHERE company_id = v_company_id
        AND job_offer_id = v_job_offer3_id
        AND user_id = v_thomas_id
    ) THEN
      INSERT INTO public.beyond_connect_matches (
        company_id,
        job_offer_id,
        user_id,
        match_score,
        skills_match,
        experience_match,
        education_match,
        details,
        created_at,
        updated_at
      ) VALUES (
        v_company_id,
        v_job_offer3_id,
        v_thomas_id,
        78.0,
        75.0,
        70.0,
        85.0,
        jsonb_build_object(
          'match_reason', 'Profil data science avec des compétences en développement. Potentiel pour apprendre le développement web.',
          'soft_skills_match', 80.0
        ),
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  RAISE NOTICE '✅ Matchings créés';

  -- ============================================
  -- 7. CRÉER DES CV DANS LA CVTHÈQUE
  -- ============================================
  
  IF v_company_id IS NOT NULL AND v_admin_id IS NOT NULL AND v_alex_id IS NOT NULL THEN
    INSERT INTO public.beyond_connect_cv_library (
      company_id,
      user_id,
      added_by,
      notes,
      tags,
      created_at
    ) VALUES (
      v_company_id,
      v_alex_id,
      v_admin_id,
      'Profil très intéressant avec une solide expérience en développement full stack. À suivre pour de futures opportunités.',
      ARRAY['Talent', 'À suivre', 'Potentiel', 'Full Stack'],
      NOW()
    )
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;

  IF v_company_id IS NOT NULL AND v_admin_id IS NOT NULL AND v_sarah_id IS NOT NULL THEN
    INSERT INTO public.beyond_connect_cv_library (
      company_id,
      user_id,
      added_by,
      notes,
      tags,
      created_at
    ) VALUES (
      v_company_id,
      v_sarah_id,
      v_admin_id,
      'Excellente candidate pour des postes de chef de projet. Expérience solide et compétences recherchées.',
      ARRAY['Talent', 'Chef de Projet', 'Agile'],
      NOW()
    )
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;

  RAISE NOTICE '✅ CV ajoutés à la CVthèque';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Toutes les données mock Beyond Connect ont été créées avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Comptes créés:';
  RAISE NOTICE '   - recruteur@techcorp.fr (Admin TechCorp)';
  RAISE NOTICE '   - alex.dupont@beyondcenter.fr (Candidat - Développeur)';
  RAISE NOTICE '   - sarah.bernard@beyondcenter.fr (Candidat - Chef de Projet)';
  RAISE NOTICE '   - thomas.leroy@beyondcenter.fr (Candidat - Data Analyst)';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Mot de passe pour tous: Demo123!@#';
END $$;

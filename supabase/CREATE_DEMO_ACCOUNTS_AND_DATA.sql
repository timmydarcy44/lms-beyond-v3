-- ============================================
-- CRÉATION DES COMPTES DE DÉMONSTRATION
-- ============================================
-- Ce script crée :
-- 1. Un formateur : formateur@beyond.fr (Tony Starck) avec toutes ses données fictives
-- 2. Un apprenant : apprenant@beyond.fr (Bruce Wayne)
-- 3. Un tuteur : tuteur@beyond.fr (Jean tutorat)
-- ============================================
-- Usage: Exécuter dans Supabase Studio SQL Editor
-- IMPORTANT: Ce script crée directement les utilisateurs dans auth.users
-- ============================================

BEGIN;

-- Activer l'extension pgcrypto pour le hashage des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- CRÉATION DES UTILISATEURS ET DONNÉES
-- ============================================

DO $$
DECLARE
  v_formateur_id uuid;
  v_apprenant_id uuid;
  v_tuteur_id uuid;
  v_org_id uuid;
  v_group_id uuid;
  v_course1_id uuid;
  v_course2_id uuid;
  v_path_id uuid;
  v_resource1_id uuid;
  v_resource2_id uuid;
  v_test1_id uuid;
  v_test2_id uuid;
  v_folder_id uuid;
  v_doc1_id uuid;
  v_doc2_id uuid;
  v_message1_id uuid;
  v_message2_id uuid;
  v_learner1_id uuid;
  v_learner2_id uuid;
  v_learner3_id uuid;
  v_instance_id uuid;
BEGIN
  -- Récupérer l'instance_id depuis un utilisateur existant ou utiliser une valeur par défaut
  SELECT instance_id INTO v_instance_id
  FROM auth.users
  LIMIT 1;
  
  IF v_instance_id IS NULL THEN
    -- Si aucun utilisateur n'existe, utiliser l'instance_id par défaut de Supabase
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- ============================================
  -- 1. CRÉER OU RÉCUPÉRER LES UTILISATEURS
  -- ============================================
  
  -- Formateur : Tony Starck
  SELECT id INTO v_formateur_id
  FROM auth.users
  WHERE email = 'formateur@beyond.fr'
  LIMIT 1;

  IF v_formateur_id IS NULL THEN
    v_formateur_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_instance_id, v_formateur_id, 'authenticated', 'authenticated',
      'formateur@beyond.fr', crypt('formateur123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tony Starck"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    RAISE NOTICE '✓ Formateur créé: formateur@beyond.fr (ID: %)', v_formateur_id;
  ELSE
    RAISE NOTICE '✓ Formateur existant trouvé: formateur@beyond.fr (ID: %)', v_formateur_id;
  END IF;

  -- Apprenant : Bruce Wayne
  SELECT id INTO v_apprenant_id
  FROM auth.users
  WHERE email = 'apprenant@beyond.fr'
  LIMIT 1;

  IF v_apprenant_id IS NULL THEN
    v_apprenant_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_instance_id, v_apprenant_id, 'authenticated', 'authenticated',
      'apprenant@beyond.fr', crypt('apprenant123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Bruce Wayne"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    RAISE NOTICE '✓ Apprenant créé: apprenant@beyond.fr (ID: %)', v_apprenant_id;
  ELSE
    RAISE NOTICE '✓ Apprenant existant trouvé: apprenant@beyond.fr (ID: %)', v_apprenant_id;
  END IF;

  -- Tuteur : Jean tutorat
  SELECT id INTO v_tuteur_id
  FROM auth.users
  WHERE email = 'tuteur@beyond.fr'
  LIMIT 1;

  IF v_tuteur_id IS NULL THEN
    v_tuteur_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_instance_id, v_tuteur_id, 'authenticated', 'authenticated',
      'tuteur@beyond.fr', crypt('tuteur123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Jean tutorat"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    RAISE NOTICE '✓ Tuteur créé: tuteur@beyond.fr (ID: %)', v_tuteur_id;
  ELSE
    RAISE NOTICE '✓ Tuteur existant trouvé: tuteur@beyond.fr (ID: %)', v_tuteur_id;
  END IF;

  -- Apprenant fictif 1 : Alice Martin
  SELECT id INTO v_learner1_id
  FROM auth.users
  WHERE email = 'learner1@beyond.fr'
  LIMIT 1;

  IF v_learner1_id IS NULL THEN
    v_learner1_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_instance_id, v_learner1_id, 'authenticated', 'authenticated',
      'learner1@beyond.fr', crypt('learner123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alice Martin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    RAISE NOTICE '✓ Apprenant fictif 1 créé: learner1@beyond.fr (ID: %)', v_learner1_id;
  ELSE
    RAISE NOTICE '✓ Apprenant fictif 1 existant trouvé: learner1@beyond.fr (ID: %)', v_learner1_id;
  END IF;

  -- Apprenant fictif 2 : Bob Dupont
  SELECT id INTO v_learner2_id
  FROM auth.users
  WHERE email = 'learner2@beyond.fr'
  LIMIT 1;

  IF v_learner2_id IS NULL THEN
    v_learner2_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_instance_id, v_learner2_id, 'authenticated', 'authenticated',
      'learner2@beyond.fr', crypt('learner123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Bob Dupont"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    RAISE NOTICE '✓ Apprenant fictif 2 créé: learner2@beyond.fr (ID: %)', v_learner2_id;
  ELSE
    RAISE NOTICE '✓ Apprenant fictif 2 existant trouvé: learner2@beyond.fr (ID: %)', v_learner2_id;
  END IF;

  -- Apprenant fictif 3 : Clara Bernard
  SELECT id INTO v_learner3_id
  FROM auth.users
  WHERE email = 'learner3@beyond.fr'
  LIMIT 1;

  IF v_learner3_id IS NULL THEN
    v_learner3_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_instance_id, v_learner3_id, 'authenticated', 'authenticated',
      'learner3@beyond.fr', crypt('learner123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Clara Bernard"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    RAISE NOTICE '✓ Apprenant fictif 3 créé: learner3@beyond.fr (ID: %)', v_learner3_id;
  ELSE
    RAISE NOTICE '✓ Apprenant fictif 3 existant trouvé: learner3@beyond.fr (ID: %)', v_learner3_id;
  END IF;
  
  -- Supprimer les données existantes pour permettre la réexécution
  -- (mais garder les utilisateurs)
  DELETE FROM public.message_recipients WHERE message_id IN (
    SELECT id FROM public.messages WHERE sender_id = v_formateur_id
  );
  DELETE FROM public.messages WHERE sender_id = v_formateur_id;
  -- Supprimer les documents du drive (utiliser author_id)
  DELETE FROM public.drive_documents WHERE author_id = v_formateur_id;
  
  -- Supprimer les dossiers du drive (utiliser owner_id)
  DELETE FROM public.drive_folders WHERE owner_id = v_formateur_id;
  DELETE FROM public.content_assignments WHERE assigned_by = v_formateur_id;
  DELETE FROM public.path_tests WHERE path_id IN (SELECT id FROM public.paths WHERE creator_id = v_formateur_id);
  DELETE FROM public.path_resources WHERE path_id IN (SELECT id FROM public.paths WHERE creator_id = v_formateur_id);
  DELETE FROM public.path_courses WHERE path_id IN (SELECT id FROM public.paths WHERE creator_id = v_formateur_id);
  DELETE FROM public.paths WHERE creator_id = v_formateur_id;
  DELETE FROM public.catalog_items WHERE created_by = v_formateur_id;
  DELETE FROM public.tests WHERE created_by = v_formateur_id;
  DELETE FROM public.resources WHERE created_by = v_formateur_id;
  DELETE FROM public.courses WHERE creator_id = v_formateur_id;
  DELETE FROM public.group_members WHERE group_id IN (SELECT id FROM public.groups WHERE org_id IN (SELECT id FROM public.organizations WHERE slug = 'beyond-academy'));
  DELETE FROM public.groups WHERE org_id IN (SELECT id FROM public.organizations WHERE slug = 'beyond-academy');
  DELETE FROM public.org_memberships WHERE org_id IN (SELECT id FROM public.organizations WHERE slug = 'beyond-academy');
  
  -- Ne PAS supprimer les utilisateurs, juste les profils et membreships
  DELETE FROM public.profiles WHERE id IN (v_formateur_id, v_apprenant_id, v_tuteur_id, v_learner1_id, v_learner2_id, v_learner3_id);
  
  -- Supprimer l'organisation si elle existe
  DELETE FROM public.organizations WHERE slug = 'beyond-academy';
  

  -- ============================================
  -- 2. CRÉER LES PROFILS
  -- ============================================

  -- Profil formateur
  INSERT INTO public.profiles (id, role, email, full_name, display_name, first_name, last_name, created_at)
  VALUES (
    v_formateur_id,
    'instructor',
    'formateur@beyond.fr',
    'Tony Starck',
    'Tony Starck',
    'Tony',
    'Starck',
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'instructor',
    email = 'formateur@beyond.fr',
    full_name = 'Tony Starck',
    display_name = 'Tony Starck',
    first_name = 'Tony',
    last_name = 'Starck';

  -- Profil apprenant
  INSERT INTO public.profiles (id, role, email, full_name, display_name, first_name, last_name, created_at)
  VALUES (
    v_apprenant_id,
    'student',
    'apprenant@beyond.fr',
    'Bruce Wayne',
    'Bruce Wayne',
    'Bruce',
    'Wayne',
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'student',
    email = 'apprenant@beyond.fr',
    full_name = 'Bruce Wayne',
    display_name = 'Bruce Wayne',
    first_name = 'Bruce',
    last_name = 'Wayne';

  -- Profil tuteur
  INSERT INTO public.profiles (id, role, email, full_name, display_name, first_name, last_name, created_at)
  VALUES (
    v_tuteur_id,
    'tutor',
    'tuteur@beyond.fr',
    'Jean tutorat',
    'Jean tutorat',
    'Jean',
    'tutorat',
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'tutor',
    email = 'tuteur@beyond.fr',
    full_name = 'Jean tutorat',
    display_name = 'Jean tutorat',
    first_name = 'Jean',
    last_name = 'tutorat';

  -- ============================================
  -- 3. CRÉER L'ORGANISATION POUR LE FORMATEUR
  -- ============================================

  INSERT INTO public.organizations (id, name, slug, description, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Beyond Academy',
    'beyond-academy',
    'Organisation de démonstration pour Tony Starck',
    now(),
    now()
  ) ON CONFLICT (slug) DO UPDATE SET
    name = 'Beyond Academy',
    description = 'Organisation de démonstration pour Tony Starck'
  RETURNING id INTO v_org_id;

  -- Ajouter le formateur à l'organisation
  INSERT INTO public.org_memberships (org_id, user_id, role, created_at)
  VALUES (v_org_id, v_formateur_id, 'instructor', now())
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'instructor';

  -- Ajouter l'apprenant à l'organisation
  INSERT INTO public.org_memberships (org_id, user_id, role, created_at)
  VALUES (v_org_id, v_apprenant_id, 'learner', now())
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'learner';

  -- Ajouter le tuteur à l'organisation
  INSERT INTO public.org_memberships (org_id, user_id, role, created_at)
  VALUES (v_org_id, v_tuteur_id, 'tutor', now())
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'tutor';

  -- ============================================
  -- 4. CRÉER LES PROFILS DES APPRENANTS FICTIFS
  -- ============================================

  -- Profil apprenant fictif 1
  INSERT INTO public.profiles (id, role, email, full_name, display_name, first_name, last_name, created_at)
  VALUES (v_learner1_id, 'student', 'learner1@beyond.fr', 'Alice Martin', 'Alice Martin', 'Alice', 'Martin', now())
  ON CONFLICT (id) DO UPDATE SET role = 'student', email = 'learner1@beyond.fr', full_name = 'Alice Martin';

  -- Profil apprenant fictif 2
  INSERT INTO public.profiles (id, role, email, full_name, display_name, first_name, last_name, created_at)
  VALUES (v_learner2_id, 'student', 'learner2@beyond.fr', 'Bob Dupont', 'Bob Dupont', 'Bob', 'Dupont', now())
  ON CONFLICT (id) DO UPDATE SET role = 'student', email = 'learner2@beyond.fr', full_name = 'Bob Dupont';

  -- Profil apprenant fictif 3
  INSERT INTO public.profiles (id, role, email, full_name, display_name, first_name, last_name, created_at)
  VALUES (v_learner3_id, 'student', 'learner3@beyond.fr', 'Clara Bernard', 'Clara Bernard', 'Clara', 'Bernard', now())
  ON CONFLICT (id) DO UPDATE SET role = 'student', email = 'learner3@beyond.fr', full_name = 'Clara Bernard';

  -- Ajouter les apprenants fictifs à l'organisation
  INSERT INTO public.org_memberships (org_id, user_id, role, created_at)
  VALUES (v_org_id, v_learner1_id, 'learner', now())
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'learner';

  INSERT INTO public.org_memberships (org_id, user_id, role, created_at)
  VALUES (v_org_id, v_learner2_id, 'learner', now())
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'learner';

  INSERT INTO public.org_memberships (org_id, user_id, role, created_at)
  VALUES (v_org_id, v_learner3_id, 'learner', now())
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'learner';

  -- ============================================
  -- 5. CRÉER UN GROUPE
  -- ============================================

  INSERT INTO public.groups (id, org_id, name, description, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_org_id,
    'Groupe Débutants 2024',
    'Groupe de démonstration pour les apprenants débutants',
    now(),
    now()
  ) RETURNING id INTO v_group_id;

  -- Ajouter les apprenants fictifs au groupe
  INSERT INTO public.group_members (group_id, user_id, created_at)
  VALUES (v_group_id, v_learner1_id, now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.group_members (group_id, user_id, created_at)
  VALUES (v_group_id, v_learner2_id, now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.group_members (group_id, user_id, created_at)
  VALUES (v_group_id, v_learner3_id, now()) ON CONFLICT DO NOTHING;

  -- ============================================
  -- 6. CRÉER DES FORMATIONS
  -- ============================================

  -- Formation 1
  INSERT INTO public.courses (id, slug, title, description, status, creator_id, builder_snapshot, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'introduction-design-thinking',
    'Introduction au Design Thinking',
    'Découvrez les fondamentaux du Design Thinking et apprenez à résoudre des problèmes complexes avec une approche centrée utilisateur.',
    'published',
    v_formateur_id,
    '{"sections": [{"id": "sec1", "title": "Les bases", "chapters": [{"id": "ch1", "title": "Qu''est-ce que le Design Thinking ?", "content": "Le Design Thinking est une méthode..."}]}]}'::jsonb,
    now(),
    now()
  ) RETURNING id INTO v_course1_id;

  -- Formation 2
  INSERT INTO public.courses (id, slug, title, description, status, creator_id, builder_snapshot, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'ux-research-avance',
    'UX Research Avancé',
    'Maîtrisez les techniques avancées de recherche utilisateur pour créer des produits exceptionnels.',
    'published',
    v_formateur_id,
    '{"sections": [{"id": "sec1", "title": "Méthodes de recherche", "chapters": [{"id": "ch1", "title": "Interviews utilisateurs", "content": "Les interviews sont essentielles..."}]}]}'::jsonb,
    now(),
    now()
  ) RETURNING id INTO v_course2_id;

  -- Ajouter les formations au catalogue
  INSERT INTO public.catalog_items (id, item_type, content_id, title, description, is_active, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'module',
    v_course1_id,
    'Introduction au Design Thinking',
    'Découvrez les fondamentaux du Design Thinking',
    true,
    v_formateur_id,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.catalog_items (id, item_type, content_id, title, description, is_active, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'module',
    v_course2_id,
    'UX Research Avancé',
    'Maîtrisez les techniques avancées de recherche utilisateur',
    true,
    v_formateur_id,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  -- Assigner les formations aux apprenants
  INSERT INTO public.content_assignments (id, content_type, content_id, learner_id, assigned_by, assigned_at)
  VALUES (gen_random_uuid(), 'course', v_course1_id, v_learner1_id, v_formateur_id, now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.content_assignments (id, content_type, content_id, learner_id, assigned_by, assigned_at)
  VALUES (gen_random_uuid(), 'course', v_course1_id, v_learner2_id, v_formateur_id, now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.content_assignments (id, content_type, content_id, group_id, assigned_by, assigned_at)
  VALUES (gen_random_uuid(), 'course', v_course2_id, v_group_id, v_formateur_id, now()) ON CONFLICT DO NOTHING;

  -- ============================================
  -- 7. CRÉER UN PARCOURS
  -- ============================================

  INSERT INTO public.paths (id, slug, title, description, status, creator_id, thumbnail_url, hero_url, builder_snapshot, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'parcours-ux-complet',
    'Parcours UX Complet',
    'Un parcours complet pour devenir expert en UX Design, de la recherche à la conception.',
    'published',
    v_formateur_id,
    'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800',
    'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200',
    '{"courses": [], "tests": [], "resources": []}'::jsonb,
    now(),
    now()
  ) RETURNING id INTO v_path_id;

  -- Ajouter les formations au parcours
  INSERT INTO public.path_courses (path_id, course_id, "order")
  VALUES (v_path_id, v_course1_id, 0) ON CONFLICT DO NOTHING;
  INSERT INTO public.path_courses (path_id, course_id, "order")
  VALUES (v_path_id, v_course2_id, 1) ON CONFLICT DO NOTHING;

  -- Ajouter le parcours au catalogue
  INSERT INTO public.catalog_items (id, item_type, content_id, title, description, is_active, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'parcours',
    v_path_id,
    'Parcours UX Complet',
    'Un parcours complet pour devenir expert en UX Design',
    true,
    v_formateur_id,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  -- Assigner le parcours au groupe
  INSERT INTO public.content_assignments (id, content_type, content_id, group_id, assigned_by, assigned_at)
  VALUES (gen_random_uuid(), 'path', v_path_id, v_group_id, v_formateur_id, now()) ON CONFLICT DO NOTHING;

  -- ============================================
  -- 8. CRÉER DES RESSOURCES
  -- ============================================

  -- Ressource 1
  INSERT INTO public.resources (id, slug, title, description, type, status, created_by, media_url, thumbnail_url, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'guide-design-thinking',
    'Guide Complet du Design Thinking',
    'Un guide PDF complet avec toutes les méthodes et outils du Design Thinking.',
    'guide',
    'published',
    v_formateur_id,
    'https://example.com/guides/design-thinking.pdf',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
    now(),
    now()
  ) RETURNING id INTO v_resource1_id;

  -- Ressource 2
  INSERT INTO public.resources (id, slug, title, description, type, status, created_by, media_url, thumbnail_url, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'fiche-interview-utilisateur',
    'Fiche : Comment mener une interview utilisateur',
    'Une fiche pratique avec les meilleures pratiques pour mener des interviews utilisateurs efficaces.',
    'fiche',
    'published',
    v_formateur_id,
    'https://example.com/fiches/interview-utilisateur.pdf',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    now(),
    now()
  ) RETURNING id INTO v_resource2_id;

  -- Ajouter les ressources au catalogue
  INSERT INTO public.catalog_items (id, item_type, content_id, title, description, is_active, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'ressource',
    v_resource1_id,
    'Guide Complet du Design Thinking',
    'Un guide PDF complet avec toutes les méthodes',
    true,
    v_formateur_id,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.catalog_items (id, item_type, content_id, title, description, is_active, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'ressource',
    v_resource2_id,
    'Fiche : Comment mener une interview utilisateur',
    'Une fiche pratique avec les meilleures pratiques',
    true,
    v_formateur_id,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  -- Ajouter les ressources au parcours
  INSERT INTO public.path_resources (path_id, resource_id, "order")
  VALUES (v_path_id, v_resource1_id, 0) ON CONFLICT DO NOTHING;
  INSERT INTO public.path_resources (path_id, resource_id, "order")
  VALUES (v_path_id, v_resource2_id, 1) ON CONFLICT DO NOTHING;

  -- ============================================
  -- 9. CRÉER DES TESTS
  -- ============================================

  -- Test 1
  INSERT INTO public.tests (id, slug, title, description, status, kind, duration_minutes, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'quiz-design-thinking-basics',
    'Quiz : Les bases du Design Thinking',
    'Testez vos connaissances sur les fondamentaux du Design Thinking.',
    'published',
    'quiz',
    30,
    v_formateur_id,
    now(),
    now()
  ) RETURNING id INTO v_test1_id;

  -- Test 2
  INSERT INTO public.tests (id, slug, title, description, status, kind, duration_minutes, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'evaluation-ux-research',
    'Évaluation : Techniques de UX Research',
    'Évaluez votre maîtrise des techniques de recherche utilisateur.',
    'published',
    'quiz',
    45,
    v_formateur_id,
    now(),
    now()
  ) RETURNING id INTO v_test2_id;

  -- Ajouter les tests au catalogue
  INSERT INTO public.catalog_items (id, item_type, content_id, title, description, is_active, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'test',
    v_test1_id,
    'Quiz : Les bases du Design Thinking',
    'Testez vos connaissances sur les fondamentaux',
    true,
    v_formateur_id,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.catalog_items (id, item_type, content_id, title, description, is_active, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'test',
    v_test2_id,
    'Évaluation : Techniques de UX Research',
    'Évaluez votre maîtrise des techniques',
    true,
    v_formateur_id,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  -- Ajouter les tests au parcours
  INSERT INTO public.path_tests (path_id, test_id, "order")
  VALUES (v_path_id, v_test1_id, 0) ON CONFLICT DO NOTHING;
  INSERT INTO public.path_tests (path_id, test_id, "order")
  VALUES (v_path_id, v_test2_id, 1) ON CONFLICT DO NOTHING;

  -- ============================================
  -- 10. CRÉER DES FICHIERS DANS LE DRIVE
  -- ============================================

  -- Créer un dossier (utiliser owner_id)
  INSERT INTO public.drive_folders (id, owner_id, name, created_at)
  VALUES (
    gen_random_uuid(),
    v_formateur_id,
    'Mes Documents',
    now()
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO v_folder_id;
  
  -- Si le dossier existe déjà, récupérer son ID
  IF v_folder_id IS NULL THEN
    SELECT id INTO v_folder_id
    FROM public.drive_folders
    WHERE owner_id = v_formateur_id AND name = 'Mes Documents'
    LIMIT 1;
  END IF;

  -- Document 1 (utiliser author_id et title)
  INSERT INTO public.drive_documents (id, author_id, folder_id, title, file_url, created_at, updated_at, status)
  VALUES (
    gen_random_uuid(),
    v_formateur_id,
    v_folder_id,
    'Présentation Design Thinking.pdf',
    'https://example.com/drive/presentation-design-thinking.pdf',
    now(),
    now(),
    'draft'
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO v_doc1_id;

  -- Document 2 (utiliser author_id et title)
  INSERT INTO public.drive_documents (id, author_id, folder_id, title, file_url, created_at, updated_at, status)
  VALUES (
    gen_random_uuid(),
    v_formateur_id,
    v_folder_id,
    'Notes de cours UX Research.docx',
    'https://example.com/drive/notes-ux-research.docx',
    now(),
    now(),
    'draft'
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO v_doc2_id;

  -- ============================================
  -- 11. CRÉER DES MESSAGES
  -- ============================================

  -- Message 1 (consigne)
  INSERT INTO public.messages (id, sender_id, content, type, metadata, created_at)
  VALUES (
    gen_random_uuid(),
    v_formateur_id,
    'Bonjour ! Pour cette semaine, je vous demande de lire le guide sur le Design Thinking et de préparer un court résumé. N''hésitez pas si vous avez des questions !',
    'consigne',
    '{"title": "Consigne de la semaine", "deadline": "2024-12-01"}'::jsonb,
    now()
  ) RETURNING id INTO v_message1_id;

  -- Ajouter les destinataires
  INSERT INTO public.message_recipients (id, message_id, recipient_id, read, created_at)
  VALUES (gen_random_uuid(), v_message1_id, v_learner1_id, false, now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.message_recipients (id, message_id, recipient_id, read, created_at)
  VALUES (gen_random_uuid(), v_message1_id, v_learner2_id, false, now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.message_recipients (id, message_id, recipient_id, read, created_at)
  VALUES (gen_random_uuid(), v_message1_id, v_learner3_id, true, now()) ON CONFLICT DO NOTHING;

  -- Message 2 (message normal)
  INSERT INTO public.messages (id, sender_id, content, type, metadata, created_at)
  VALUES (
    gen_random_uuid(),
    v_formateur_id,
    'Excellent travail sur le dernier projet ! Continuez comme ça.',
    'message',
    NULL,
    now()
  ) RETURNING id INTO v_message2_id;

  INSERT INTO public.message_recipients (id, message_id, recipient_id, read, created_at)
  VALUES (gen_random_uuid(), v_message2_id, v_learner1_id, true, now()) ON CONFLICT DO NOTHING;

  -- ============================================
  -- 12. CRÉER DES PROGRÈS POUR LES APPRENANTS
  -- ============================================

  -- Progrès sur la formation 1
  INSERT INTO public.course_progress (id, user_id, course_id, progress_percent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_learner1_id, v_course1_id, 45, now(), now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.course_progress (id, user_id, course_id, progress_percent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_learner2_id, v_course1_id, 30, now(), now()) ON CONFLICT DO NOTHING;

  -- Progrès sur le parcours
  INSERT INTO public.path_progress (id, user_id, path_id, progress_percent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_learner1_id, v_path_id, 35, now(), now()) ON CONFLICT DO NOTHING;

  -- Tentatives de test
  INSERT INTO public.test_attempts (id, user_id, test_id, score, created_at, updated_at)
  VALUES (gen_random_uuid(), v_learner1_id, v_test1_id, 85, now(), now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.test_attempts (id, user_id, test_id, score, created_at, updated_at)
  VALUES (gen_random_uuid(), v_learner2_id, v_test1_id, 72, now(), now()) ON CONFLICT DO NOTHING;

  -- Vues de ressources
  INSERT INTO public.resource_views (id, user_id, resource_id, created_at)
  VALUES (gen_random_uuid(), v_learner1_id, v_resource1_id, now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.resource_views (id, user_id, resource_id, created_at)
  VALUES (gen_random_uuid(), v_learner2_id, v_resource1_id, now()) ON CONFLICT DO NOTHING;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'COMPTES DE DÉMONSTRATION CRÉÉS AVEC SUCCÈS';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Formateur: formateur@beyond.fr / formateur123';
  RAISE NOTICE 'Apprenant: apprenant@beyond.fr / apprenant123';
  RAISE NOTICE 'Tuteur: tuteur@beyond.fr / tuteur123';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Données créées pour le formateur:';
  RAISE NOTICE '- 3 apprenants fictifs (learner1@beyond.fr, learner2@beyond.fr, learner3@beyond.fr)';
  RAISE NOTICE '- 2 formations';
  RAISE NOTICE '- 1 parcours';
  RAISE NOTICE '- 1 groupe';
  RAISE NOTICE '- 2 ressources';
  RAISE NOTICE '- 2 tests';
  RAISE NOTICE '- 2 fichiers drive';
  RAISE NOTICE '- 2 messages';
  RAISE NOTICE '============================================';

END $$;

COMMIT;


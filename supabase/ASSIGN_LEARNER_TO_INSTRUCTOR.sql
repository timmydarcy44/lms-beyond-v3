-- ============================================
-- Script pour assigner un apprenant à un formateur
-- ============================================
-- Ce script :
-- 1. Vérifie/crée le profil de l'apprenant j.contentin@laposte.net
-- 2. Le définit comme "student" (apprenant)
-- 3. Trouve le formateur timmydarcy44@gmail.com
-- 4. Crée ou trouve son organisation
-- 5. Assign l'apprenant à cette organisation avec le rôle "learner"
-- ============================================

DO $$
DECLARE
  v_learner_email text := 'j.contentin@laposte.net';
  v_instructor_email text := 'timmydarcy44@gmail.com';
  v_learner_id uuid;
  v_instructor_id uuid;
  v_org_id uuid;
BEGIN
  -- ============================================
  -- 1. Vérifier/créer le profil de l'apprenant
  -- ============================================
  RAISE NOTICE 'Étape 1 : Vérification du profil apprenant %', v_learner_email;
  
  -- Chercher l'utilisateur dans auth.users
  SELECT id INTO v_learner_id
  FROM auth.users
  WHERE email = v_learner_email;
  
  -- Si l'utilisateur n'existe pas dans auth.users, on ne peut pas continuer
  IF v_learner_id IS NULL THEN
    RAISE EXCEPTION 'L''utilisateur % n''existe pas dans auth.users. Il doit d''abord créer un compte et se connecter au moins une fois.', v_learner_email;
  END IF;
  
  RAISE NOTICE '✓ Utilisateur trouvé dans auth.users : %', v_learner_id;
  
  -- Vérifier/créer le profil dans profiles
  INSERT INTO public.profiles (id, email, role)
  VALUES (v_learner_id, v_learner_email, 'student')
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    role = 'student',
    updated_at = now();
  
  -- Mettre à jour full_name si email contient un nom
  UPDATE public.profiles
  SET full_name = COALESCE(full_name, split_part(v_learner_email, '@', 1))
  WHERE id = v_learner_id AND full_name IS NULL;
  
  RAISE NOTICE '✓ Profil apprenant configuré avec le rôle "student"';
  
  -- ============================================
  -- 2. Trouver le formateur
  -- ============================================
  RAISE NOTICE 'Étape 2 : Recherche du formateur %', v_instructor_email;
  
  SELECT id INTO v_instructor_id
  FROM auth.users
  WHERE email = v_instructor_email;
  
  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Le formateur % n''existe pas dans auth.users.', v_instructor_email;
  END IF;
  
  RAISE NOTICE '✓ Formateur trouvé : %', v_instructor_id;
  
  -- S'assurer que le formateur a le rôle "instructor" dans profiles
  INSERT INTO public.profiles (id, email, role)
  VALUES (v_instructor_id, v_instructor_email, 'instructor')
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    role = 'instructor',
    updated_at = now();
  
  RAISE NOTICE '✓ Profil formateur vérifié avec le rôle "instructor"';
  
  -- ============================================
  -- 3. Créer ou trouver l'organisation du formateur
  -- ============================================
  RAISE NOTICE 'Étape 3 : Recherche/création de l''organisation du formateur';
  
  -- Chercher si le formateur a déjà une organisation
  SELECT om.org_id INTO v_org_id
  FROM public.org_memberships om
  WHERE om.user_id = v_instructor_id
    AND om.role = 'instructor'
  LIMIT 1;
  
  -- Si pas d'organisation, en créer une
  IF v_org_id IS NULL THEN
    -- Créer une organisation par défaut pour le formateur
    INSERT INTO public.organizations (id, name, slug)
    VALUES (
      gen_random_uuid(),
      'Organisation de ' || (SELECT COALESCE(full_name, email) FROM public.profiles WHERE id = v_instructor_id),
      'org-' || replace(v_instructor_email, '@', '-at-') || '-' || substring(gen_random_uuid()::text, 1, 8)
    )
    RETURNING id INTO v_org_id;
    
    RAISE NOTICE '✓ Organisation créée : %', v_org_id;
    
    -- Assigner le formateur à cette organisation
    INSERT INTO public.org_memberships (org_id, user_id, role)
    VALUES (v_org_id, v_instructor_id, 'instructor')
    ON CONFLICT (org_id, user_id) 
    DO UPDATE SET role = 'instructor';
    
    RAISE NOTICE '✓ Formateur assigné à l''organisation';
  ELSE
    RAISE NOTICE '✓ Organisation existante trouvée : %', v_org_id;
  END IF;
  
  -- ============================================
  -- 4. Assigner l'apprenant à l'organisation du formateur
  -- ============================================
  RAISE NOTICE 'Étape 4 : Assignation de l''apprenant à l''organisation';
  
  INSERT INTO public.org_memberships (org_id, user_id, role)
  VALUES (v_org_id, v_learner_id, 'learner')
  ON CONFLICT (org_id, user_id) 
  DO UPDATE SET role = 'learner';
  
  RAISE NOTICE '✓ Apprenant % assigné à l''organisation du formateur avec le rôle "learner"', v_learner_email;
  
  -- ============================================
  -- 5. Résumé
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ ASSIGNATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Apprenant : % (ID: %)', v_learner_email, v_learner_id;
  RAISE NOTICE 'Formateur : % (ID: %)', v_instructor_email, v_instructor_id;
  RAISE NOTICE 'Organisation : %', v_org_id;
  RAISE NOTICE 'L''apprenant est maintenant visible par le formateur dans son dashboard';
  RAISE NOTICE '===========================================';
  
END $$;

-- Vérification finale
SELECT 
  p.email as "Email",
  p.role as "Rôle global",
  om.role as "Rôle dans l'org",
  o.name as "Organisation"
FROM public.profiles p
LEFT JOIN public.org_memberships om ON p.id = om.user_id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email IN ('j.contentin@laposte.net', 'timmydarcy44@gmail.com')
ORDER BY p.email, o.name;


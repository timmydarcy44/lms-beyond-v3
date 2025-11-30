-- Script pour créer un test Soft Skills pour Tim Darcy avec Beyond No School
-- ============================================================================
-- Ce script crée un questionnaire "Soft Skills – Profil 360" avec les mêmes
-- questions, le même système de scoring, et la même page de résultat que
-- le test existant, mais avec created_by = Tim Darcy

DO $$
DECLARE
  v_tim_darcy_id UUID;
  v_beyond_no_school_org_id UUID;
  v_questionnaire_id UUID;
  v_question_id UUID;
  v_dimension TEXT;
  v_question_text TEXT;
  v_order_index INTEGER := 0;
  v_question_ids JSONB := '{}'::JSONB;
  v_scoring_config JSONB;
  
  -- Les 40 questions du test Soft Skills
  questions_data RECORD;
BEGIN
  -- 1. Trouver l'ID de Tim Darcy
  SELECT id INTO v_tim_darcy_id
  FROM public.profiles
  WHERE email = 'timdarcypro@gmail.com';
  
  IF v_tim_darcy_id IS NULL THEN
    RAISE EXCEPTION 'Tim Darcy (timdarcypro@gmail.com) non trouvé dans profiles';
  END IF;
  
  RAISE NOTICE 'Tim Darcy ID: %', v_tim_darcy_id;
  
  -- 2. Trouver l'organisation Beyond No School ou une organisation de Tim Darcy
  -- Essayer d'abord de trouver une organisation de Tim Darcy
  SELECT om.org_id INTO v_beyond_no_school_org_id
  FROM public.org_memberships om
  WHERE om.user_id = v_tim_darcy_id
  LIMIT 1;
  
  -- Si pas trouvé, chercher Beyond No School par nom
  IF v_beyond_no_school_org_id IS NULL THEN
    SELECT id INTO v_beyond_no_school_org_id
    FROM public.organizations
    WHERE name ILIKE '%Beyond No School%' 
       OR name ILIKE '%Beyond%No%School%'
       OR name ILIKE '%Beyond%'
    LIMIT 1;
  END IF;
  
  -- Si toujours pas trouvé, prendre la première organisation disponible
  IF v_beyond_no_school_org_id IS NULL THEN
    SELECT id INTO v_beyond_no_school_org_id
    FROM public.organizations
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  IF v_beyond_no_school_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvée. Veuillez créer une organisation d''abord.';
  END IF;
  
  RAISE NOTICE 'Beyond No School Org ID: %', v_beyond_no_school_org_id;
  
  -- 3. Supprimer l'ancien questionnaire s'il existe
  DELETE FROM public.mental_health_questions
  WHERE questionnaire_id IN (
    SELECT id FROM public.mental_health_questionnaires
    WHERE org_id = v_beyond_no_school_org_id
    AND title = 'Soft Skills – Profil 360'
    AND created_by = v_tim_darcy_id
  );
  
  DELETE FROM public.mental_health_questionnaires
  WHERE org_id = v_beyond_no_school_org_id
  AND title = 'Soft Skills – Profil 360'
  AND created_by = v_tim_darcy_id;
  
  -- 4. Créer le questionnaire
  INSERT INTO public.mental_health_questionnaires (
    org_id,
    title,
    description,
    is_active,
    frequency,
    send_day,
    send_time,
    target_roles,
    created_by,
    scoring_config
  ) VALUES (
    v_beyond_no_school_org_id,
    'Soft Skills – Profil 360',
    'Questionnaire soft skills sur 10 dimensions clés (communication, leadership, empathie, créativité, organisation, prise de décision, etc.).',
    true,
    'quarterly',
    1,
    '08:00:00',
    ARRAY['learner'],
    v_tim_darcy_id,
    '{"enabled": true, "max_score": 100, "categories": []}'::JSONB
  )
  RETURNING id INTO v_questionnaire_id;
  
  RAISE NOTICE 'Questionnaire créé avec ID: %', v_questionnaire_id;
  
  -- 5. Créer les 40 questions
  FOR questions_data IN
    SELECT * FROM (VALUES
      ('gestion_emotions_stress', 'Je prends du recul quand je suis stressé(e).'),
      ('communication_influence', 'J''explique clairement mes idées, même en groupe.'),
      ('perseverance_action', 'Je prends des initiatives pour résoudre un problème sans attendre qu''on me le demande.'),
      ('organisation_priorites', 'Je planifie mes journées pour être efficace.'),
      ('empathie_ecoute_active', 'Je repère les émotions des autres, même quand elles ne sont pas dites.'),
      ('resolution_problemes', 'Je prends le temps d''analyser un problème avant d''agir.'),
      ('collaboration_conflits', 'J''écoute chaque point de vue avant de donner le mien.'),
      ('creativite_adaptabilite', 'J''aime tester de nouvelles approches dans mes projets.'),
      ('leadership_vision', 'Je prends le rôle de guide quand un groupe en a besoin.'),
      ('confiance_decision', 'Je recherche les informations dont j''ai besoin avant de prendre une décision.'),
      ('organisation_priorites', 'Je demande de l''aide quand je vois que je ne pourrai pas respecter un délai.'),
      ('communication_influence', 'J''adapte ma façon de parler si je sens que l''autre ne comprend pas.'),
      ('gestion_emotions_stress', 'Je reste concentré(e) même sous pression.'),
      ('perseverance_action', 'Je continue malgré les obstacles quand un objectif me tient à cœur.'),
      ('collaboration_conflits', 'Je propose des solutions satisfaisantes pour toutes les personnes concernées.'),
      ('empathie_ecoute_active', 'Je pose des questions pour mieux comprendre ce que l''autre ressent.'),
      ('resolution_problemes', 'Je décompose les situations complexes en étapes plus simples.'),
      ('creativite_adaptabilite', 'Je propose des idées originales pour résoudre un problème.'),
      ('leadership_vision', 'Je propose des idées pour améliorer les méthodes ou les processus.'),
      ('confiance_decision', 'Je fais confiance à mon jugement dans les décisions importantes.'),
      ('communication_influence', 'J''utilise des exemples simples pour expliquer quelque chose.'),
      ('organisation_priorites', 'Je classe mes tâches selon leur importance.'),
      ('gestion_emotions_stress', 'Je reconnais rapidement mes émotions dans une situation difficile.'),
      ('perseverance_action', 'Je reste engagé(e) même quand la motivation baisse.'),
      ('collaboration_conflits', 'Je m''adapte facilement aux différentes personnalités dans un groupe.'),
      ('resolution_problemes', 'Je vérifie la fiabilité d''une information avant d''y croire.'),
      ('creativite_adaptabilite', 'Je m''adapte facilement quand mes plans changent.'),
      ('empathie_ecoute_active', 'Je reformule parfois pour vérifier que j''ai bien compris ce que l''autre me dit.'),
      ('leadership_vision', 'Je repère facilement les objectifs à long terme dans un projet.'),
      ('confiance_decision', 'Je suis capable de trancher rapidement lorsqu''une décision est urgente.'),
      ('communication_influence', 'Je sais présenter une idée de manière convaincante.'),
      ('organisation_priorites', 'Je réorganise rapidement mes priorités lorsqu''un imprévu survient.'),
      ('gestion_emotions_stress', 'Je fais attention à mes mots quand je suis en colère ou contrarié(e).'),
      ('perseverance_action', 'Je saisis rapidement une opportunité qui se présente.'),
      ('collaboration_conflits', 'Je reste calme quand une situation devient tendue.'),
      ('resolution_problemes', 'Je cherche une nouvelle solution si la méthode habituelle ne fonctionne pas.'),
      ('creativite_adaptabilite', 'Je modifie ma façon de faire lorsque quelque chose ne fonctionne pas comme prévu.'),
      ('empathie_ecoute_active', 'Je reste pleinement attentif(ve) quand quelqu''un me parle.'),
      ('leadership_vision', 'Je valorise les forces des personnes autour de moi.'),
      ('confiance_decision', 'Je défends mon point de vue calmement lorsque c''est nécessaire.')
    ) AS q(dimension, question_text)
  LOOP
    v_question_id := gen_random_uuid();
    
    -- Ajouter l'ID de la question à la map des dimensions
    IF v_question_ids->questions_data.dimension IS NULL THEN
      v_question_ids := jsonb_set(v_question_ids, ARRAY[questions_data.dimension], '[]'::JSONB);
    END IF;
    v_question_ids := jsonb_set(
      v_question_ids,
      ARRAY[questions_data.dimension],
      (v_question_ids->questions_data.dimension)::JSONB || jsonb_build_array(v_question_id)
    );
    
    -- Insérer la question
    INSERT INTO public.mental_health_questions (
      id,
      questionnaire_id,
      question_text,
      question_type,
      order_index,
      is_required,
      likert_scale,
      options,
      scoring,
      metadata
    ) VALUES (
      v_question_id,
      v_questionnaire_id,
      questions_data.question_text,
      'likert',
      v_order_index,
      true,
      '{"min": 1, "max": 5, "labels": {"1": "Pas du tout", "2": "Plutôt non", "3": "Ni oui ni non", "4": "Plutôt oui", "5": "Tout à fait"}}'::JSONB,
      NULL,
      '{"enabled": true, "points": {"1": 1, "2": 2, "3": 3, "4": 4, "5": 5}, "weight": 1}'::JSONB,
      jsonb_build_object('dimension', questions_data.dimension)
    );
    
    v_order_index := v_order_index + 1;
  END LOOP;
  
  -- 6. Construire le scoring_config final avec les catégories
  v_scoring_config := jsonb_build_object(
    'enabled', true,
    'max_score', 100,
    'categories', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', CASE 
            WHEN key = 'gestion_emotions_stress' THEN 'Gestion des émotions & du stress'
            WHEN key = 'communication_influence' THEN 'Communication & influence'
            WHEN key = 'perseverance_action' THEN 'Persévérance & passage à l''action'
            WHEN key = 'organisation_priorites' THEN 'Organisation, temps & priorités'
            WHEN key = 'empathie_ecoute_active' THEN 'Empathie & écoute active'
            WHEN key = 'resolution_problemes' THEN 'Résolution de problèmes & pensée critique'
            WHEN key = 'collaboration_conflits' THEN 'Collaboration & gestion des conflits'
            WHEN key = 'creativite_adaptabilite' THEN 'Créativité & adaptabilité'
            WHEN key = 'leadership_vision' THEN 'Leadership & vision'
            WHEN key = 'confiance_decision' THEN 'Confiance en soi & prise de décision'
            ELSE key
          END,
          'questions', value,
          'weight', 1
        )
      )
      FROM jsonb_each(v_question_ids)
    )
  );
  
  -- 7. Mettre à jour le scoring_config du questionnaire
  UPDATE public.mental_health_questionnaires
  SET scoring_config = v_scoring_config
  WHERE id = v_questionnaire_id;
  
  RAISE NOTICE 'Test Soft Skills créé avec succès pour Tim Darcy!';
  RAISE NOTICE 'Questionnaire ID: %', v_questionnaire_id;
  RAISE NOTICE 'Nombre de questions: %', v_order_index;
  
END $$;


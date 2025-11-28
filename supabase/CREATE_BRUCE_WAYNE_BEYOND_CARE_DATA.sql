-- ============================================
-- SCRIPT DE CRÉATION DES DONNÉES MOCKÉES
-- POUR BRUCE WAYNE (demo@beyondcenter.fr)
-- BEYOND CARE - Apprenant et Entreprise
-- ============================================

-- Créer la table mental_health_indicators si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.mental_health_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES public.mental_health_questionnaires(id) ON DELETE SET NULL,
  indicator_type TEXT NOT NULL,
  indicator_value NUMERIC NOT NULL,
  indicator_label TEXT,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, indicator_type, week_start_date)
);

-- Créer les index si nécessaire
CREATE INDEX IF NOT EXISTS mental_health_indicators_user_id_idx 
  ON public.mental_health_indicators (user_id);
CREATE INDEX IF NOT EXISTS mental_health_indicators_created_at_idx 
  ON public.mental_health_indicators (created_at DESC);
CREATE INDEX IF NOT EXISTS mental_health_indicators_org_id_idx 
  ON public.mental_health_indicators (org_id);
CREATE INDEX IF NOT EXISTS mental_health_indicators_week_idx 
  ON public.mental_health_indicators (user_id, week_start_date);

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.mental_health_indicators ENABLE ROW LEVEL SECURITY;

-- Créer les policies RLS si elles n'existent pas
DO $$
BEGIN
  -- Policy pour les utilisateurs (voir leurs propres indicateurs)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'mental_health_indicators' 
    AND policyname = 'Users can view their own indicators'
  ) THEN
    CREATE POLICY "Users can view their own indicators"
      ON public.mental_health_indicators
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  -- Policy pour les admins (voir les indicateurs de leur organisation)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'mental_health_indicators' 
    AND policyname = 'Admins can view their organization indicators'
  ) THEN
    CREATE POLICY "Admins can view their organization indicators"
      ON public.mental_health_indicators
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.org_memberships om
          WHERE om.org_id = mental_health_indicators.org_id
            AND om.user_id = auth.uid()
            AND om.role = 'admin'
        )
      );
  END IF;
END $$;

-- Variables (à remplacer par les valeurs réelles après exécution du script JS)
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_questionnaire_1_id UUID;
  v_questionnaire_2_id UUID;
  v_questionnaire_3_id UUID; -- Questionnaire fonctionnement naturel
  v_question_1_id UUID;
  v_question_2_id UUID;
  v_question_3_id UUID;
  v_question_4_id UUID;
  v_question_5_id UUID;
  v_question_6_id UUID;
  v_question_7_id UUID;
  v_question_8_id UUID;
  v_question_9_id UUID;
  v_question_10_id UUID;
  v_assessment_1_id UUID;
  v_assessment_2_id UUID;
  -- Variables pour les questions du fonctionnement naturel
  v_fn_q1_id UUID;
  v_fn_q2_id UUID;
  v_fn_q3_id UUID;
  v_fn_q4_id UUID;
  v_fn_q5_id UUID;
  -- Variables pour les dates des semaines
  week_1_start DATE;
  week_1_end DATE;
  week_2_start DATE;
  week_2_end DATE;
  week_3_start DATE;
  week_3_end DATE;
  week_4_start DATE;
  week_4_end DATE;
BEGIN
  -- Récupérer l'ID de l'utilisateur Bruce Wayne
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = 'demo@beyondcenter.fr'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur demo@beyondcenter.fr non trouvé. Veuillez d''abord exécuter le script create-bruce-wayne-beyond-care.js';
  END IF;

  -- Récupérer l'ID de l'organisation
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = 'beyond-center-demo'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organisation beyond-center-demo non trouvée. Veuillez d''abord exécuter le script create-bruce-wayne-beyond-care.js';
  END IF;

  RAISE NOTICE 'Utilisateur trouvé: %', v_user_id;
  RAISE NOTICE 'Organisation trouvée: %', v_org_id;

  -- ============================================
  -- 1. CRÉER LES QUESTIONNAIRES
  -- ============================================

  -- Questionnaire 1: Questionnaire hebdomadaire de bien-être
  INSERT INTO public.mental_health_questionnaires (
    id, org_id, title, description, is_active, frequency, send_day, send_time,
    target_roles, created_by, scoring_config
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'Questionnaire hebdomadaire de bien-être',
    'Évaluation hebdomadaire de votre état de bien-être, stress et motivation',
    true,
    'weekly',
    5, -- Vendredi
    '18:00:00',
    ARRAY['learner', 'student'],
    v_user_id,
    jsonb_build_object(
      'enabled', true,
      'max_score', 100,
      'categories', jsonb_build_array(
        jsonb_build_object('name', 'Bien-être général', 'questions', jsonb_build_array(), 'weight', 1),
        jsonb_build_object('name', 'Stress', 'questions', jsonb_build_array(), 'weight', 1.5),
        jsonb_build_object('name', 'Motivation', 'questions', jsonb_build_array(), 'weight', 1)
      )
    )
  ) RETURNING id INTO v_questionnaire_1_id;

  RAISE NOTICE 'Questionnaire 1 créé: %', v_questionnaire_1_id;

  -- Questionnaire 2: Évaluation mensuelle approfondie
  INSERT INTO public.mental_health_questionnaires (
    id, org_id, title, description, is_active, frequency, send_day, send_time,
    target_roles, created_by, scoring_config
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'Évaluation mensuelle approfondie',
    'Questionnaire mensuel pour une analyse approfondie de votre état mental et émotionnel',
    true,
    'monthly',
    1, -- Lundi
    '08:00:00',
    ARRAY['learner', 'student'],
    v_user_id,
    jsonb_build_object(
      'enabled', true,
      'max_score', 100,
      'categories', jsonb_build_array(
        jsonb_build_object('name', 'Bien-être général', 'questions', jsonb_build_array(), 'weight', 1),
        jsonb_build_object('name', 'Gestion du stress', 'questions', jsonb_build_array(), 'weight', 1.5),
        jsonb_build_object('name', 'Relations sociales', 'questions', jsonb_build_array(), 'weight', 1)
      )
    )
  ) RETURNING id INTO v_questionnaire_2_id;

  RAISE NOTICE 'Questionnaire 2 créé: %', v_questionnaire_2_id;

  -- ============================================
  -- 2. CRÉER LES QUESTIONS
  -- ============================================

  -- Questions pour le questionnaire 1
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    options, scoring, metadata
  ) VALUES
  -- Question 1: Comment vous sentez-vous aujourd'hui ?
  (
    gen_random_uuid(),
    v_questionnaire_1_id,
    'Comment vous sentez-vous aujourd''hui ?',
    'single_choice',
    0,
    true,
    jsonb_build_array(
      jsonb_build_object('id', 'opt1', 'label', 'Très bien', 'value', 'very_good', 'points', 10),
      jsonb_build_object('id', 'opt2', 'label', 'Bien', 'value', 'good', 'points', 7),
      jsonb_build_object('id', 'opt3', 'label', 'Moyen', 'value', 'average', 'points', 4),
      jsonb_build_object('id', 'opt4', 'label', 'Mal', 'value', 'bad', 'points', 1)
    ),
    jsonb_build_object('enabled', true, 'weight', 1),
    jsonb_build_object('dimension', 'wellbeing')
  ) RETURNING id INTO v_question_1_id;

  -- Question 2: Niveau de stress
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES
  (
    gen_random_uuid(),
    v_questionnaire_1_id,
    'Sur une échelle de 1 à 10, quel est votre niveau de stress actuel ?',
    'likert',
    1,
    true,
    jsonb_build_object(
      'min', 1,
      'max', 10,
      'labels', jsonb_build_object('1', 'Aucun stress', '5', 'Stress modéré', '10', 'Stress extrême')
    ),
    jsonb_build_object(
      'enabled', true,
      'points', jsonb_build_object('1', 10, '2', 9, '3', 8, '4', 7, '5', 6, '6', 5, '7', 4, '8', 3, '9', 2, '10', 1),
      'weight', 1.5
    ),
    jsonb_build_object('dimension', 'stress')
  ) RETURNING id INTO v_question_2_id;

  -- Question 3: Motivation
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES
  (
    gen_random_uuid(),
    v_questionnaire_1_id,
    'Quel est votre niveau de motivation cette semaine ?',
    'likert',
    2,
    true,
    jsonb_build_object(
      'min', 1,
      'max', 10,
      'labels', jsonb_build_object('1', 'Très faible', '5', 'Moyen', '10', 'Très élevé')
    ),
    jsonb_build_object(
      'enabled', true,
      'points', jsonb_build_object('1', 1, '2', 2, '3', 3, '4', 4, '5', 5, '6', 6, '7', 7, '8', 8, '9', 9, '10', 10),
      'weight', 1
    ),
    jsonb_build_object('dimension', 'motivation')
  ) RETURNING id INTO v_question_3_id;

  -- Questions pour le questionnaire 2
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    options, scoring, metadata
  ) VALUES
  -- Question 4: Bien-être général
  (
    gen_random_uuid(),
    v_questionnaire_2_id,
    'Dans l''ensemble, comment évaluez-vous votre bien-être ce mois-ci ?',
    'single_choice',
    0,
    true,
    jsonb_build_array(
      jsonb_build_object('id', 'opt1', 'label', 'Excellent', 'value', 'excellent', 'points', 10),
      jsonb_build_object('id', 'opt2', 'label', 'Bon', 'value', 'good', 'points', 7),
      jsonb_build_object('id', 'opt3', 'label', 'Moyen', 'value', 'average', 'points', 4),
      jsonb_build_object('id', 'opt4', 'label', 'Faible', 'value', 'poor', 'points', 1)
    ),
    jsonb_build_object('enabled', true, 'weight', 1),
    jsonb_build_object('dimension', 'wellbeing')
  ) RETURNING id INTO v_question_4_id;

  -- Question 5: Gestion du stress
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES
  (
    gen_random_uuid(),
    v_questionnaire_2_id,
    'Comment gérez-vous le stress dans votre quotidien ?',
    'likert',
    1,
    true,
    jsonb_build_object(
      'min', 1,
      'max', 5,
      'labels', jsonb_build_object('1', 'Très mal', '3', 'Moyennement', '5', 'Très bien')
    ),
    jsonb_build_object(
      'enabled', true,
      'points', jsonb_build_object('1', 2, '2', 4, '3', 6, '4', 8, '5', 10),
      'weight', 1.5
    ),
    jsonb_build_object('dimension', 'stress')
  ) RETURNING id INTO v_question_5_id;

  -- Question 6: Relations sociales
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES
  (
    gen_random_uuid(),
    v_questionnaire_2_id,
    'Comment évaluez-vous la qualité de vos relations sociales ?',
    'likert',
    2,
    true,
    jsonb_build_object(
      'min', 1,
      'max', 5,
      'labels', jsonb_build_object('1', 'Très faible', '3', 'Moyen', '5', 'Très bonne')
    ),
    jsonb_build_object(
      'enabled', true,
      'points', jsonb_build_object('1', 2, '2', 4, '3', 6, '4', 8, '5', 10),
      'weight', 1
    ),
    jsonb_build_object('dimension', 'social')
  ) RETURNING id INTO v_question_6_id;

  RAISE NOTICE 'Questions créées';

  -- ============================================
  -- 2.5. CRÉER LE QUESTIONNAIRE "FONCTIONNEMENT NATUREL"
  -- ============================================

  -- Questionnaire 3: Beyond Profile – Fonctionnement naturel
  INSERT INTO public.mental_health_questionnaires (
    id, org_id, title, description, is_active, frequency, send_day, send_time,
    target_roles, created_by, scoring_config
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'Beyond Profile – Fonctionnement naturel',
    'Questionnaire Beyond Care · fonctionnement naturel (besoins sociaux, émotions, énergie, organisation, coping).',
    true,
    'monthly',
    1, -- Lundi
    '07:30:00',
    ARRAY['learner', 'student'],
    v_user_id,
    jsonb_build_object(
      'enabled', true,
      'max_score', 100,
      'categories', jsonb_build_array(
        jsonb_build_object('name', 'Besoin social naturel', 'questions', jsonb_build_array(), 'weight', 1),
        jsonb_build_object('name', 'Mode émotionnel naturel', 'questions', jsonb_build_array(), 'weight', 1),
        jsonb_build_object('name', 'Énergie & rythme interne', 'questions', jsonb_build_array(), 'weight', 1),
        jsonb_build_object('name', 'Style cognitif organisationnel', 'questions', jsonb_build_array(), 'weight', 1),
        jsonb_build_object('name', 'Coping naturel', 'questions', jsonb_build_array(), 'weight', 1)
      )
    )
  ) RETURNING id INTO v_questionnaire_3_id;

  RAISE NOTICE 'Questionnaire 3 (Fonctionnement naturel) créé: %', v_questionnaire_3_id;

  -- Créer quelques questions clés du questionnaire fonctionnement naturel
  -- (On crée un échantillon représentatif pour les données mockées)
  -- Générer les IDs des questions
  v_fn_q1_id := gen_random_uuid();
  v_fn_q2_id := gen_random_uuid();
  v_fn_q3_id := gen_random_uuid();
  v_fn_q4_id := gen_random_uuid();
  v_fn_q5_id := gen_random_uuid();

  -- Besoin social naturel
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES (
    v_fn_q1_id,
    v_questionnaire_3_id,
    'J''ai naturellement besoin de temps seul·e pour me ressourcer.',
    'likert',
    0,
    true,
    jsonb_build_object('min', 1, 'max', 5, 'labels', jsonb_build_object('1', 'Pas du tout', '5', 'Tout à fait')),
    jsonb_build_object('enabled', true, 'points', jsonb_build_object('1', 1, '2', 2, '3', 3, '4', 4, '5', 5), 'weight', 1),
    jsonb_build_object('dimension', 'besoin_social_naturel')
  );
  
  -- Mode émotionnel naturel
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES (
    v_fn_q2_id,
    v_questionnaire_3_id,
    'Je ressens mes émotions de manière intense, quelle qu''elles soient.',
    'likert',
    1,
    true,
    jsonb_build_object('min', 1, 'max', 5, 'labels', jsonb_build_object('1', 'Pas du tout', '5', 'Tout à fait')),
    jsonb_build_object('enabled', true, 'points', jsonb_build_object('1', 1, '2', 2, '3', 3, '4', 4, '5', 5), 'weight', 1),
    jsonb_build_object('dimension', 'mode_emotionnel_naturel')
  );
  
  -- Énergie & rythme interne
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES (
    v_fn_q3_id,
    v_questionnaire_3_id,
    'Mon niveau d''énergie naturel est plutôt bas et constant.',
    'likert',
    2,
    true,
    jsonb_build_object('min', 1, 'max', 5, 'labels', jsonb_build_object('1', 'Pas du tout', '5', 'Tout à fait')),
    jsonb_build_object('enabled', true, 'points', jsonb_build_object('1', 1, '2', 2, '3', 3, '4', 4, '5', 5), 'weight', 1),
    jsonb_build_object('dimension', 'energie_rythme_interne')
  );
  
  -- Style cognitif organisationnel
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES (
    v_fn_q4_id,
    v_questionnaire_3_id,
    'J''ai besoin d''un environnement organisé pour me sentir bien.',
    'likert',
    3,
    true,
    jsonb_build_object('min', 1, 'max', 5, 'labels', jsonb_build_object('1', 'Pas du tout', '5', 'Tout à fait')),
    jsonb_build_object('enabled', true, 'points', jsonb_build_object('1', 1, '2', 2, '3', 3, '4', 4, '5', 5), 'weight', 1),
    jsonb_build_object('dimension', 'style_cognitif_organisationnel')
  );
  
  -- Coping naturel
  INSERT INTO public.mental_health_questions (
    id, questionnaire_id, question_text, question_type, order_index, is_required,
    likert_scale, scoring, metadata
  ) VALUES (
    v_fn_q5_id,
    v_questionnaire_3_id,
    'Quand une difficulté arrive, j''essaie d''abord de régler les choses seul·e.',
    'likert',
    4,
    true,
    jsonb_build_object('min', 1, 'max', 5, 'labels', jsonb_build_object('1', 'Pas du tout', '5', 'Tout à fait')),
    jsonb_build_object('enabled', true, 'points', jsonb_build_object('1', 1, '2', 2, '3', 3, '4', 4, '5', 5), 'weight', 1),
    jsonb_build_object('dimension', 'coping_naturel')
  );

  RAISE NOTICE 'Questions du questionnaire fonctionnement naturel créées';

  RAISE NOTICE 'Questions du questionnaire fonctionnement naturel créées';

  -- ============================================
  -- 3. CRÉER LES RÉPONSES (2 semaines de données)
  -- ============================================

  -- Réponses pour le questionnaire 1 - Semaine 1 (il y a 1 semaine)
  INSERT INTO public.mental_health_responses (
    questionnaire_id, question_id, user_id, org_id, response_value, response_json
  ) VALUES
  (
    v_questionnaire_1_id, v_question_1_id, v_user_id, v_org_id, 'good',
    jsonb_build_object('selected', 'good', 'points', 7)
  ),
  (
    v_questionnaire_1_id, v_question_2_id, v_user_id, v_org_id, '6',
    jsonb_build_object('value', 6, 'points', 5)
  ),
  (
    v_questionnaire_1_id, v_question_3_id, v_user_id, v_org_id, '7',
    jsonb_build_object('value', 7, 'points', 7)
  );

  -- Réponses pour le questionnaire 1 - Semaine 2 (cette semaine)
  INSERT INTO public.mental_health_responses (
    questionnaire_id, question_id, user_id, org_id, response_value, response_json,
    created_at
  ) VALUES
  (
    v_questionnaire_1_id, v_question_1_id, v_user_id, v_org_id, 'very_good',
    jsonb_build_object('selected', 'very_good', 'points', 10),
    now() - interval '2 days'
  ),
  (
    v_questionnaire_1_id, v_question_2_id, v_user_id, v_org_id, '4',
    jsonb_build_object('value', 4, 'points', 7),
    now() - interval '2 days'
  ),
  (
    v_questionnaire_1_id, v_question_3_id, v_user_id, v_org_id, '8',
    jsonb_build_object('value', 8, 'points', 8),
    now() - interval '2 days'
  );

  -- Réponses pour le questionnaire 2 - Mois dernier
  INSERT INTO public.mental_health_responses (
    questionnaire_id, question_id, user_id, org_id, response_value, response_json,
    created_at
  ) VALUES
  (
    v_questionnaire_2_id, v_question_4_id, v_user_id, v_org_id, 'good',
    jsonb_build_object('selected', 'good', 'points', 7),
    now() - interval '30 days'
  ),
  (
    v_questionnaire_2_id, v_question_5_id, v_user_id, v_org_id, '3',
    jsonb_build_object('value', 3, 'points', 6),
    now() - interval '30 days'
  ),
  (
    v_questionnaire_2_id, v_question_6_id, v_user_id, v_org_id, '4',
    jsonb_build_object('value', 4, 'points', 8),
    now() - interval '30 days'
  );

  -- Réponses pour le questionnaire fonctionnement naturel (il y a 2 semaines)
  INSERT INTO public.mental_health_responses (
    questionnaire_id, question_id, user_id, org_id, response_value, response_json,
    created_at
  ) VALUES
  (
    v_questionnaire_3_id, v_fn_q1_id, v_user_id, v_org_id, '4',
    jsonb_build_object('value', 4, 'points', 4),
    now() - interval '14 days'
  ),
  (
    v_questionnaire_3_id, v_fn_q2_id, v_user_id, v_org_id, '3',
    jsonb_build_object('value', 3, 'points', 3),
    now() - interval '14 days'
  ),
  (
    v_questionnaire_3_id, v_fn_q3_id, v_user_id, v_org_id, '3',
    jsonb_build_object('value', 3, 'points', 3),
    now() - interval '14 days'
  ),
  (
    v_questionnaire_3_id, v_fn_q4_id, v_user_id, v_org_id, '4',
    jsonb_build_object('value', 4, 'points', 4),
    now() - interval '14 days'
  ),
  (
    v_questionnaire_3_id, v_fn_q5_id, v_user_id, v_org_id, '3',
    jsonb_build_object('value', 3, 'points', 3),
    now() - interval '14 days'
  );

  RAISE NOTICE 'Réponses créées';

  -- ============================================
  -- 4. CRÉER LES ASSESSMENTS
  -- ============================================

  -- Assessment 1 - Questionnaire hebdomadaire (semaine dernière)
  INSERT INTO public.mental_health_assessments (
    id, questionnaire_id, user_id, org_id, overall_score, dimension_scores,
    analysis_summary, analysis_details
  ) VALUES (
    gen_random_uuid(),
    v_questionnaire_1_id,
    v_user_id,
    v_org_id,
    63.3, -- (7 + 5 + 7) / 3 * 10
    jsonb_build_object(
      'wellbeing', 70,
      'stress', 50,
      'motivation', 70
    ),
    'État de bien-être correct avec un niveau de stress modéré. La motivation est bonne.',
    jsonb_build_object(
      'strengths', jsonb_build_array('Bien-être général stable', 'Motivation présente'),
      'areas_for_improvement', jsonb_build_array('Gestion du stress')
    )
  ) RETURNING id INTO v_assessment_1_id;

  -- Assessment 2 - Questionnaire hebdomadaire (cette semaine)
  INSERT INTO public.mental_health_assessments (
    id, questionnaire_id, user_id, org_id, overall_score, dimension_scores,
    analysis_summary, analysis_details, created_at
  ) VALUES (
    gen_random_uuid(),
    v_questionnaire_1_id,
    v_user_id,
    v_org_id,
    83.3, -- (10 + 7 + 8) / 3 * 10
    jsonb_build_object(
      'wellbeing', 100,
      'stress', 70,
      'motivation', 80
    ),
    'Amélioration significative du bien-être. Le stress a diminué et la motivation est en hausse.',
    jsonb_build_object(
      'strengths', jsonb_build_array('Bien-être excellent', 'Stress mieux géré', 'Motivation élevée'),
      'trend', 'improving'
    ),
    now() - interval '2 days'
  ) RETURNING id INTO v_assessment_2_id;

  -- Assessment 3 - Questionnaire mensuel
  INSERT INTO public.mental_health_assessments (
    id, questionnaire_id, user_id, org_id, overall_score, dimension_scores,
    analysis_summary, analysis_details, created_at
  ) VALUES (
    gen_random_uuid(),
    v_questionnaire_2_id,
    v_user_id,
    v_org_id,
    70.0, -- (7 + 6 + 8) / 3 * 10
    jsonb_build_object(
      'wellbeing', 70,
      'stress', 60,
      'social', 80
    ),
    'Bien-être général satisfaisant avec de bonnes relations sociales. La gestion du stress peut être améliorée.',
    jsonb_build_object(
      'strengths', jsonb_build_array('Relations sociales de qualité'),
      'areas_for_improvement', jsonb_build_array('Techniques de gestion du stress')
    ),
    now() - interval '30 days'
  );

  -- Assessment 4 - Questionnaire fonctionnement naturel
  INSERT INTO public.mental_health_assessments (
    id, questionnaire_id, user_id, org_id, overall_score, dimension_scores,
    analysis_summary, analysis_details, created_at
  ) VALUES (
    gen_random_uuid(),
    v_questionnaire_3_id,
    v_user_id,
    v_org_id,
    68.0, -- Score moyen basé sur les réponses (4+3+3+4+3)/5 * 20
    jsonb_build_object(
      'besoin_social_naturel', 80,
      'mode_emotionnel_naturel', 60,
      'energie_rythme_interne', 60,
      'style_cognitif_organisationnel', 80,
      'coping_naturel', 60
    ),
    'Profil de fonctionnement naturel équilibré avec un besoin d''organisation et de temps seul. Les émotions sont modérées et le coping est plutôt autonome.',
    jsonb_build_object(
      'strengths', jsonb_build_array('Besoin d''organisation clair', 'Autonomie dans la gestion des difficultés'),
      'areas_for_improvement', jsonb_build_array('Expression des émotions', 'Demande d''aide quand nécessaire')
    ),
    now() - interval '14 days'
  );

  RAISE NOTICE 'Assessments créés';

  -- ============================================
  -- 5. CRÉER LES INDICATEURS (4 semaines de données)
  -- ============================================

  -- Supprimer les indicateurs existants pour cet utilisateur pour éviter les doublons
  DELETE FROM public.mental_health_indicators WHERE user_id = v_user_id;

  -- Calculer les dates des semaines
  week_1_start := date_trunc('week', now() - interval '3 weeks')::date;
  week_1_end := week_1_start + interval '6 days';
  week_2_start := date_trunc('week', now() - interval '2 weeks')::date;
  week_2_end := week_2_start + interval '6 days';
  week_3_start := date_trunc('week', now() - interval '1 week')::date;
  week_3_end := week_3_start + interval '6 days';
  week_4_start := date_trunc('week', now())::date;
  week_4_end := week_4_start + interval '6 days';

  -- Semaine 1
  INSERT INTO public.mental_health_indicators (
    user_id, org_id, questionnaire_id, indicator_type, indicator_value, indicator_label,
    week_start_date, week_end_date, calculated_at
  ) VALUES
  (v_user_id, v_org_id, v_questionnaire_1_id, 'stress', 60, 'Stress', week_1_start, week_1_end, week_1_end),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'wellbeing', 65, 'Bien-être', week_1_start, week_1_end, week_1_end),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'motivation', 70, 'Motivation', week_1_start, week_1_end, week_1_end);

  -- Semaine 2
  INSERT INTO public.mental_health_indicators (
    user_id, org_id, questionnaire_id, indicator_type, indicator_value, indicator_label,
    week_start_date, week_end_date, calculated_at
  ) VALUES
  (v_user_id, v_org_id, v_questionnaire_1_id, 'stress', 55, 'Stress', week_2_start, week_2_end, week_2_end),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'wellbeing', 70, 'Bien-être', week_2_start, week_2_end, week_2_end),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'motivation', 72, 'Motivation', week_2_start, week_2_end, week_2_end);

  -- Semaine 3 (avec assessment 1 - semaine dernière)
  -- Utiliser les valeurs de l'assessment 1
  INSERT INTO public.mental_health_indicators (
    user_id, org_id, questionnaire_id, indicator_type, indicator_value, indicator_label,
    week_start_date, week_end_date, calculated_at
  ) VALUES
  (v_user_id, v_org_id, v_questionnaire_1_id, 'stress', 50, 'Stress', week_3_start, week_3_end, week_3_end),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'wellbeing', 70, 'Bien-être', week_3_start, week_3_end, week_3_end),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'motivation', 70, 'Motivation', week_3_start, week_3_end, week_3_end);

  -- Semaine 4 (cette semaine - avec assessment récent)
  -- Utiliser les valeurs de l'assessment 2 (cette semaine) pour les indicateurs
  INSERT INTO public.mental_health_indicators (
    user_id, org_id, questionnaire_id, indicator_type, indicator_value, indicator_label,
    week_start_date, week_end_date, calculated_at
  ) VALUES
  (v_user_id, v_org_id, v_questionnaire_1_id, 'stress', 70, 'Stress', week_4_start, week_4_end, now() - interval '2 days'),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'wellbeing', 100, 'Bien-être', week_4_start, week_4_end, now() - interval '2 days'),
  (v_user_id, v_org_id, v_questionnaire_1_id, 'motivation', 80, 'Motivation', week_4_start, week_4_end, now() - interval '2 days');

  RAISE NOTICE 'Indicateurs créés';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Toutes les données mockées ont été créées avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   - 3 questionnaires créés (hebdomadaire, mensuel, fonctionnement naturel)';
  RAISE NOTICE '   - 11 questions créées (6 pour les questionnaires 1 et 2, 5 pour le fonctionnement naturel)';
  RAISE NOTICE '   - 14 réponses créées (9 pour questionnaires 1 et 2, 5 pour fonctionnement naturel)';
  RAISE NOTICE '   - 4 assessments créés (2 hebdomadaires, 1 mensuel, 1 fonctionnement naturel)';
  RAISE NOTICE '   - 12 indicateurs créés (4 semaines) avec valeurs stress, bien-être, motivation';
  RAISE NOTICE '     * Semaine 4: Stress=70, Bien-être=100, Motivation=80 (correspond à l''assessment récent)';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Vous pouvez maintenant vous connecter avec:';
  RAISE NOTICE '   Email: demo@beyondcenter.fr';
  RAISE NOTICE '   Mot de passe: Demo123!@#';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Questionnaires disponibles:';
  RAISE NOTICE '   - Questionnaire hebdomadaire de bien-être';
  RAISE NOTICE '   - Évaluation mensuelle approfondie';
  RAISE NOTICE '   - Beyond Profile – Fonctionnement naturel (avec accès pour Bruce Wayne)';
  RAISE NOTICE '';

END $$;


-- ============================================
-- SCRIPT POUR DONNER ACCÈS AUX QUESTIONNAIRES
-- ET AUX RÉSULTATS POUR BRUCE WAYNE
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_questionnaire_weekly_id UUID;
  v_questionnaire_monthly_id UUID;
  v_questionnaire_natural_id UUID;
  assessment_count INTEGER;
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
  -- 1. RÉCUPÉRER LES QUESTIONNAIRES
  -- ============================================

  -- Questionnaire hebdomadaire
  SELECT id INTO v_questionnaire_weekly_id
  FROM public.mental_health_questionnaires
  WHERE org_id = v_org_id
    AND title LIKE '%hebdomadaire%'
    AND frequency = 'weekly'
  LIMIT 1;

  -- Questionnaire mensuel
  SELECT id INTO v_questionnaire_monthly_id
  FROM public.mental_health_questionnaires
  WHERE org_id = v_org_id
    AND title LIKE '%mensuel%'
    AND frequency = 'monthly'
  LIMIT 1;

  -- Questionnaire fonctionnement naturel
  SELECT id INTO v_questionnaire_natural_id
  FROM public.mental_health_questionnaires
  WHERE org_id = v_org_id
    AND (title LIKE '%fonctionnement naturel%' OR title LIKE '%Beyond Profile%')
  LIMIT 1;

  RAISE NOTICE 'Questionnaire hebdomadaire trouvé: %', v_questionnaire_weekly_id;
  RAISE NOTICE 'Questionnaire mensuel trouvé: %', v_questionnaire_monthly_id;
  RAISE NOTICE 'Questionnaire fonctionnement naturel trouvé: %', v_questionnaire_natural_id;

  -- ============================================
  -- 2. S'ASSURER QUE LES QUESTIONNAIRES SONT ACTIFS
  -- ============================================

  IF v_questionnaire_weekly_id IS NOT NULL THEN
    UPDATE public.mental_health_questionnaires
    SET is_active = true
    WHERE id = v_questionnaire_weekly_id;
    RAISE NOTICE 'Questionnaire hebdomadaire activé';
  END IF;

  IF v_questionnaire_monthly_id IS NOT NULL THEN
    UPDATE public.mental_health_questionnaires
    SET is_active = true
    WHERE id = v_questionnaire_monthly_id;
    RAISE NOTICE 'Questionnaire mensuel activé';
  END IF;

  IF v_questionnaire_natural_id IS NOT NULL THEN
    UPDATE public.mental_health_questionnaires
    SET is_active = true
    WHERE id = v_questionnaire_natural_id;
    RAISE NOTICE 'Questionnaire fonctionnement naturel activé';
  END IF;

  -- ============================================
  -- 3. CRÉER UNE NOTIFICATION POUR LE QUESTIONNAIRE HEBDOMADAIRE
  -- (pour qu'il apparaisse comme "en attente" dans le dashboard)
  -- ============================================

  -- Vérifier si la table mental_health_notifications existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'mental_health_notifications'
  ) THEN
    IF v_questionnaire_weekly_id IS NOT NULL THEN
      -- Supprimer les notifications existantes non complétées pour éviter les doublons
      DELETE FROM public.mental_health_notifications
      WHERE questionnaire_id = v_questionnaire_weekly_id
        AND user_id = v_user_id
        AND completed_at IS NULL
        AND DATE(sent_at) = CURRENT_DATE;

      -- Créer une nouvelle notification pour le questionnaire hebdomadaire
      -- La table mental_health_notifications a une contrainte UNIQUE sur (questionnaire_id, user_id, DATE(sent_at))
      INSERT INTO public.mental_health_notifications (
        questionnaire_id,
        user_id,
        sent_at,
        notification_type
      ) VALUES (
        v_questionnaire_weekly_id,
        v_user_id,
        now(),
        'in_app'
      )
      ON CONFLICT (questionnaire_id, user_id, DATE(sent_at)) DO NOTHING;

      RAISE NOTICE 'Notification créée pour le questionnaire hebdomadaire';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  La table mental_health_notifications n''existe pas. La notification n''a pas été créée.';
    RAISE NOTICE '   Pour créer la table, exécutez le script CREATE_MENTAL_HEALTH_AUTO_SEND_FUNCTION.sql';
  END IF;

  -- ============================================
  -- 4. VÉRIFIER L'ACCÈS AUX RÉSULTATS (ASSESSMENTS)
  -- Les assessments sont déjà filtrés par user_id, donc l'utilisateur
  -- devrait déjà avoir accès à ses propres résultats.
  -- On vérifie juste qu'il y a bien des assessments.
  -- ============================================

  SELECT COUNT(*) INTO assessment_count
  FROM public.mental_health_assessments
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Nombre d''assessments trouvés pour l''utilisateur: %', assessment_count;

  IF assessment_count = 0 THEN
    RAISE NOTICE '⚠️  Aucun assessment trouvé. Les résultats ne seront pas visibles.';
    RAISE NOTICE '   Veuillez exécuter le script CREATE_BRUCE_WAYNE_BEYOND_CARE_DATA.sql pour créer des assessments.';
  ELSE
    RAISE NOTICE '✅ Assessments trouvés. L''utilisateur a accès à ses résultats.';
  END IF;

  -- ============================================
  -- 5. RÉSUMÉ
  -- ============================================

  RAISE NOTICE '';
  RAISE NOTICE '✅ Accès aux questionnaires et résultats configuré !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Récapitulatif:';
  RAISE NOTICE '   - Questionnaires activés et accessibles';
  IF v_questionnaire_weekly_id IS NOT NULL THEN
    RAISE NOTICE '   - Notification créée pour le questionnaire hebdomadaire';
    RAISE NOTICE '     → Le questionnaire apparaîtra comme "en attente" dans le dashboard';
  END IF;
  RAISE NOTICE '   - Les résultats (assessments) sont accessibles via user_id';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 URLs des questionnaires:';
  IF v_questionnaire_weekly_id IS NOT NULL THEN
    RAISE NOTICE '   - Questionnaire hebdomadaire: /dashboard/apprenant/questionnaires/%', v_questionnaire_weekly_id;
  END IF;
  IF v_questionnaire_monthly_id IS NOT NULL THEN
    RAISE NOTICE '   - Questionnaire mensuel: /dashboard/apprenant/questionnaires/%', v_questionnaire_monthly_id;
  END IF;
  IF v_questionnaire_natural_id IS NOT NULL THEN
    RAISE NOTICE '   - Questionnaire fonctionnement naturel: /dashboard/apprenant/questionnaires/%', v_questionnaire_natural_id;
  END IF;
  RAISE NOTICE '';

END $$;

-- ============================================
-- 6. CRÉER LES RLS POLICIES POUR L'ACCÈS DES APPRENANTS
-- ============================================
-- Note: Les policies RLS doivent être créées en dehors du bloc DO $$ car
-- CREATE POLICY ne peut pas être exécuté dans un bloc transactionnel.

-- Policy pour que les apprenants puissent voir les questionnaires de leur organisation
DROP POLICY IF EXISTS "Learners can view their organization questionnaires" ON public.mental_health_questionnaires;
CREATE POLICY "Learners can view their organization questionnaires"
  ON public.mental_health_questionnaires
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = mental_health_questionnaires.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('learner', 'student')
    )
  );

-- Policy pour que les apprenants puissent voir les questions des questionnaires de leur organisation
DROP POLICY IF EXISTS "Learners can view questions from their organization questionnaires" ON public.mental_health_questions;
CREATE POLICY "Learners can view questions from their organization questionnaires"
  ON public.mental_health_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mental_health_questionnaires mhq
      JOIN public.org_memberships om ON om.org_id = mhq.org_id
      WHERE mhq.id = mental_health_questions.questionnaire_id
        AND om.user_id = auth.uid()
        AND om.role IN ('learner', 'student')
    )
  );

-- Policy pour que les utilisateurs puissent voir leurs propres réponses
DROP POLICY IF EXISTS "Users can view their own responses" ON public.mental_health_responses;
CREATE POLICY "Users can view their own responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy pour que les utilisateurs puissent voir leurs propres assessments
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.mental_health_assessments;
CREATE POLICY "Users can view their own assessments"
  ON public.mental_health_assessments
  FOR SELECT
  USING (user_id = auth.uid());


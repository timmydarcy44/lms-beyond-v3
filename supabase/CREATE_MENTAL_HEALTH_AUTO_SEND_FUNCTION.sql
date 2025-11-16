-- ============================================
-- FONCTION POUR L'ENVOI AUTOMATIQUE DES QUESTIONNAIRES
-- ============================================
-- Cette fonction peut être appelée par un cron job ou une Edge Function
-- pour envoyer automatiquement les questionnaires en fin de semaine

-- Fonction pour envoyer les questionnaires selon leur configuration
CREATE OR REPLACE FUNCTION send_scheduled_mental_health_questionnaires()
RETURNS TABLE (
  questionnaire_id UUID,
  sent_count INTEGER,
  error_message TEXT
) AS $$
DECLARE
  current_day INTEGER;
  current_time TIME;
  current_date DATE;
  questionnaire_record RECORD;
  user_record RECORD;
  sent_count INTEGER;
  error_msg TEXT;
BEGIN
  -- Obtenir le jour actuel (0 = Dimanche, 5 = Vendredi)
  current_day := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
  current_time := CURRENT_TIME;
  current_date := CURRENT_DATE;

  -- Parcourir tous les questionnaires actifs
  FOR questionnaire_record IN
    SELECT *
    FROM public.mental_health_questionnaires
    WHERE is_active = true
      AND send_day = current_day
      AND send_time <= current_time
  LOOP
    sent_count := 0;
    error_msg := NULL;

    BEGIN
      -- Vérifier la fréquence
      -- Pour weekly: envoyer chaque semaine
      -- Pour biweekly: envoyer toutes les 2 semaines
      -- Pour monthly: envoyer chaque mois
      
      -- Pour l'instant, on envoie si c'est le bon jour et la bonne heure
      -- La logique de fréquence peut être améliorée avec une table de tracking

      -- Parcourir les utilisateurs cibles
      FOR user_record IN
        SELECT DISTINCT p.id, om.org_id
        FROM public.profiles p
        JOIN public.org_memberships om ON om.user_id = p.id
        WHERE om.org_id = questionnaire_record.org_id
          AND om.role = ANY(questionnaire_record.target_roles)
      LOOP
        -- Créer un enregistrement dans mental_health_notifications pour tracker l'envoi
        INSERT INTO public.mental_health_notifications (
          questionnaire_id,
          user_id,
          sent_at,
          notification_type
        )
        VALUES (
          questionnaire_record.id,
          user_record.id,
          NOW(),
          'email'
        )
        ON CONFLICT (questionnaire_id, user_id, DATE(sent_at)) DO NOTHING;
        
        sent_count := sent_count + 1;
      END LOOP;

      -- Retourner le résultat
      RETURN QUERY SELECT questionnaire_record.id, sent_count, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
      error_msg := SQLERRM;
      RETURN QUERY SELECT questionnaire_record.id, 0, error_msg;
    END;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION send_scheduled_mental_health_questionnaires() IS 
  'Fonction pour envoyer automatiquement les questionnaires de santé mentale selon leur configuration. À appeler via un cron job ou Edge Function.';

-- ============================================
-- TABLE POUR TRACKER LES ENVOIS
-- ============================================
-- Cette table permet de suivre quels questionnaires ont été envoyés
-- et d'éviter les envois en double

DROP TABLE IF EXISTS public.mental_health_notifications CASCADE;

CREATE TABLE IF NOT EXISTS public.mental_health_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.mental_health_questionnaires(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notification_type TEXT DEFAULT 'email', -- 'email', 'in_app', etc.
  metadata JSONB,
  UNIQUE(questionnaire_id, user_id, DATE(sent_at))
);

-- Index
CREATE INDEX IF NOT EXISTS mental_health_notifications_questionnaire_id_idx 
  ON public.mental_health_notifications (questionnaire_id);
CREATE INDEX IF NOT EXISTS mental_health_notifications_user_id_idx 
  ON public.mental_health_notifications (user_id);
CREATE INDEX IF NOT EXISTS mental_health_notifications_sent_at_idx 
  ON public.mental_health_notifications (sent_at DESC);

-- RLS Policies
ALTER TABLE public.mental_health_notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON public.mental_health_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Les admins peuvent voir les notifications de leur organisation
CREATE POLICY "Admins can view their organization notifications"
  ON public.mental_health_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mental_health_questionnaires mhq
      JOIN public.org_memberships om ON om.org_id = mhq.org_id
      WHERE mhq.id = mental_health_notifications.questionnaire_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Les super admins peuvent tout voir
CREATE POLICY "Super admins can view all notifications"
  ON public.mental_health_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
    )
  );

COMMENT ON TABLE public.mental_health_notifications IS 
  'Table pour tracker les notifications/envoyés de questionnaires de santé mentale';


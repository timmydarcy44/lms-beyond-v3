-- ============================================
-- TABLE POUR LES INDICATEURS DE SANTÉ MENTALE
-- ============================================
-- Cette table stocke les indicateurs calculés pour suivre l'évolution

-- Supprimer les objets existants si nécessaire
DROP POLICY IF EXISTS "Users can view their own indicators" ON public.mental_health_indicators;
DROP POLICY IF EXISTS "Admins can view their organization indicators" ON public.mental_health_indicators;
DROP POLICY IF EXISTS "Super admins can view all indicators" ON public.mental_health_indicators;
DROP POLICY IF EXISTS "Instructors can view their learners indicators" ON public.mental_health_indicators;
DROP POLICY IF EXISTS "Tutors can view their learners indicators" ON public.mental_health_indicators;
DROP POLICY IF EXISTS "Special users can view indicators" ON public.mental_health_indicators;
DROP TRIGGER IF EXISTS mental_health_indicators_updated_at ON public.mental_health_indicators;
DROP INDEX IF EXISTS mental_health_indicators_user_id_idx;
DROP INDEX IF EXISTS mental_health_indicators_created_at_idx;
DROP TABLE IF EXISTS public.mental_health_indicators CASCADE;

-- Créer la table
CREATE TABLE IF NOT EXISTS public.mental_health_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES public.mental_health_questionnaires(id) ON DELETE SET NULL,
  indicator_type TEXT NOT NULL, -- 'stress', 'anxiety', 'wellbeing', 'engagement', etc.
  indicator_value NUMERIC NOT NULL, -- Valeur de l'indicateur (0-100 ou autre échelle)
  indicator_label TEXT, -- Libellé de l'indicateur
  week_start_date DATE NOT NULL, -- Date de début de la semaine
  week_end_date DATE NOT NULL, -- Date de fin de la semaine
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB, -- Données supplémentaires
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un indicateur par type, par utilisateur, par semaine
  UNIQUE(user_id, indicator_type, week_start_date)
);

-- Index
CREATE INDEX IF NOT EXISTS mental_health_indicators_user_id_idx 
  ON public.mental_health_indicators (user_id);
CREATE INDEX IF NOT EXISTS mental_health_indicators_created_at_idx 
  ON public.mental_health_indicators (created_at DESC);
CREATE INDEX IF NOT EXISTS mental_health_indicators_org_id_idx 
  ON public.mental_health_indicators (org_id);
CREATE INDEX IF NOT EXISTS mental_health_indicators_week_idx 
  ON public.mental_health_indicators (user_id, week_start_date);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_mental_health_indicators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mental_health_indicators_updated_at
  BEFORE UPDATE ON public.mental_health_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_health_indicators_updated_at();

-- RLS Policies
ALTER TABLE public.mental_health_indicators ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres indicateurs
CREATE POLICY "Users can view their own indicators"
  ON public.mental_health_indicators
  FOR SELECT
  USING (user_id = auth.uid());

-- Les admins d'organisation peuvent voir les indicateurs de leur organisation
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

-- Les super admins peuvent tout voir
CREATE POLICY "Super admins can view all indicators"
  ON public.mental_health_indicators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
    )
  );

-- Les formateurs peuvent voir les indicateurs de leurs apprenants
CREATE POLICY "Instructors can view their learners indicators"
  ON public.mental_health_indicators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = mental_health_indicators.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'instructor'
    )
  );

-- Les tuteurs peuvent voir les indicateurs de leurs apprenants
CREATE POLICY "Tutors can view their learners indicators"
  ON public.mental_health_indicators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = mental_health_indicators.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'tutor'
    )
  );

-- Les utilisateurs spéciaux (comme contentin.cabinet@gmail.com) peuvent voir les indicateurs
CREATE POLICY "Special users can view indicators"
  ON public.mental_health_indicators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.email = 'contentin.cabinet@gmail.com'
    )
  );

-- Commentaires
COMMENT ON TABLE public.mental_health_indicators IS 'Indicateurs de santé mentale calculés pour suivre l''évolution';
COMMENT ON COLUMN public.mental_health_indicators.indicator_type IS 'Type d''indicateur: stress, anxiety, wellbeing, engagement, etc.';
COMMENT ON COLUMN public.mental_health_indicators.indicator_value IS 'Valeur de l''indicateur (0-100 ou autre échelle)';
COMMENT ON COLUMN public.mental_health_indicators.week_start_date IS 'Date de début de la semaine pour l''agrégation';



-- ============================================
-- TABLE POUR LES RÉPONSES AUX QUESTIONNAIRES
-- ============================================
-- Cette table stocke les réponses des apprenants

-- Supprimer les objets existants si nécessaire
DROP POLICY IF EXISTS "Users can view their own responses" ON public.mental_health_responses;
DROP POLICY IF EXISTS "Admins can view their organization responses" ON public.mental_health_responses;
DROP POLICY IF EXISTS "Super admins can view all responses" ON public.mental_health_responses;
DROP POLICY IF EXISTS "Instructors can view their learners responses" ON public.mental_health_responses;
DROP POLICY IF EXISTS "Tutors can view their learners responses" ON public.mental_health_responses;
DROP POLICY IF EXISTS "Special users can view responses" ON public.mental_health_responses;
DROP TRIGGER IF EXISTS mental_health_responses_updated_at ON public.mental_health_responses;
DROP INDEX IF EXISTS mental_health_responses_questionnaire_id_idx;
DROP INDEX IF EXISTS mental_health_responses_user_id_idx;
DROP INDEX IF EXISTS mental_health_responses_created_at_idx;
DROP TABLE IF EXISTS public.mental_health_responses CASCADE;

-- Créer la table
CREATE TABLE IF NOT EXISTS public.mental_health_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.mental_health_questionnaires(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.mental_health_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  response_value TEXT, -- Réponse textuelle ou valeur sérialisée
  response_data JSONB, -- Données structurées pour réponses complexes
  -- Exemple pour choix multiples: {"selected": ["opt1", "opt2"], "values": [1, 2]}
  -- Exemple pour Likert: {"value": 4, "label": "Tout à fait"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un utilisateur ne peut répondre qu'une fois par question par questionnaire
  UNIQUE(questionnaire_id, question_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS mental_health_responses_questionnaire_id_idx 
  ON public.mental_health_responses (questionnaire_id);
CREATE INDEX IF NOT EXISTS mental_health_responses_user_id_idx 
  ON public.mental_health_responses (user_id);
CREATE INDEX IF NOT EXISTS mental_health_responses_created_at_idx 
  ON public.mental_health_responses (created_at DESC);
CREATE INDEX IF NOT EXISTS mental_health_responses_org_id_idx 
  ON public.mental_health_responses (org_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_mental_health_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mental_health_responses_updated_at
  BEFORE UPDATE ON public.mental_health_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_health_responses_updated_at();

-- RLS Policies
ALTER TABLE public.mental_health_responses ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres réponses
CREATE POLICY "Users can view their own responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (user_id = auth.uid());

-- Les admins d'organisation peuvent voir les réponses de leur organisation
CREATE POLICY "Admins can view their organization responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = mental_health_responses.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Les super admins peuvent tout voir
CREATE POLICY "Super admins can view all responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
    )
  );

-- Les formateurs peuvent voir les réponses de leurs apprenants
CREATE POLICY "Instructors can view their learners responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = mental_health_responses.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'instructor'
    )
  );

-- Les tuteurs peuvent voir les réponses de leurs apprenants
CREATE POLICY "Tutors can view their learners responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = mental_health_responses.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'tutor'
    )
  );

-- Les utilisateurs spéciaux (comme contentin.cabinet@gmail.com) peuvent voir les réponses
-- Vérification basée sur l'email dans profiles
CREATE POLICY "Special users can view responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.email = 'contentin.cabinet@gmail.com'
    )
  );

-- Les utilisateurs peuvent insérer leurs propres réponses
CREATE POLICY "Users can insert their own responses"
  ON public.mental_health_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Commentaires
COMMENT ON TABLE public.mental_health_responses IS 'Réponses aux questionnaires de santé mentale';
COMMENT ON COLUMN public.mental_health_responses.response_value IS 'Réponse textuelle ou valeur sérialisée';
COMMENT ON COLUMN public.mental_health_responses.response_data IS 'Données structurées pour réponses complexes';








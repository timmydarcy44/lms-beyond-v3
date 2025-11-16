-- ============================================
-- TABLE POUR LES QUESTIONS DE SANTÉ MENTALE
-- ============================================
-- Cette table stocke les questions avec leur logique de théorie des jeux
-- Les réponses influencent les questions suivantes

-- Supprimer les objets existants si nécessaire
DROP POLICY IF EXISTS "Super admins can manage all questions" ON public.mental_health_questions;
DROP POLICY IF EXISTS "Admins can view their organization questions" ON public.mental_health_questions;
DROP TRIGGER IF EXISTS mental_health_questions_updated_at ON public.mental_health_questions;
DROP INDEX IF EXISTS mental_health_questions_questionnaire_id_idx;
DROP INDEX IF EXISTS mental_health_questions_order_idx;
DROP TABLE IF EXISTS public.mental_health_questions CASCADE;

-- Créer la table
CREATE TABLE IF NOT EXISTS public.mental_health_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.mental_health_questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'single_choice', 'likert', 'text', 'number'
  order_index INTEGER NOT NULL DEFAULT 0, -- Ordre d'affichage
  is_required BOOLEAN NOT NULL DEFAULT true,
  conditional_logic JSONB, -- Logique conditionnelle basée sur les réponses précédentes
  -- Exemple: {"depends_on": "question_id", "conditions": [{"value": "option1", "show": true}]}
  options JSONB, -- Options pour les questions à choix multiples
  -- Exemple: [{"id": "opt1", "label": "Option 1", "value": 1}, ...]
  likert_scale JSONB, -- Configuration pour échelle de Likert
  -- Exemple: {"min": 1, "max": 5, "labels": {"1": "Pas du tout", "5": "Tout à fait"}}
  scoring JSONB, -- Configuration du scoring pour cette question
  -- Exemple: {"enabled": true, "points": {"opt1": 10, "opt2": 5}, "weight": 1}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Index
CREATE INDEX IF NOT EXISTS mental_health_questions_questionnaire_id_idx 
  ON public.mental_health_questions (questionnaire_id);
CREATE INDEX IF NOT EXISTS mental_health_questions_order_idx 
  ON public.mental_health_questions (questionnaire_id, order_index);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_mental_health_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mental_health_questions_updated_at
  BEFORE UPDATE ON public.mental_health_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_health_questions_updated_at();

-- RLS Policies
ALTER TABLE public.mental_health_questions ENABLE ROW LEVEL SECURITY;

-- Les super admins peuvent tout voir et modifier
CREATE POLICY "Super admins can manage all questions"
  ON public.mental_health_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
    )
  );

-- Les admins d'organisation peuvent voir les questions de leur organisation
CREATE POLICY "Admins can view their organization questions"
  ON public.mental_health_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mental_health_questionnaires mhq
      JOIN public.org_memberships om ON om.org_id = mhq.org_id
      WHERE mhq.id = mental_health_questions.questionnaire_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Commentaires
COMMENT ON TABLE public.mental_health_questions IS 'Questions des questionnaires de santé mentale avec logique conditionnelle';
COMMENT ON COLUMN public.mental_health_questions.question_type IS 'Type de question: multiple_choice, single_choice, likert, text, number';
COMMENT ON COLUMN public.mental_health_questions.conditional_logic IS 'Logique conditionnelle basée sur les réponses précédentes (théorie des jeux)';
COMMENT ON COLUMN public.mental_health_questions.options IS 'Options pour les questions à choix multiples';
COMMENT ON COLUMN public.mental_health_questions.likert_scale IS 'Configuration pour échelle de Likert';
COMMENT ON COLUMN public.mental_health_questions.scoring IS 'Configuration du scoring pour cette question (points, weight)';


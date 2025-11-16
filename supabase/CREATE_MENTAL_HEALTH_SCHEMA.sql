-- Mental health questionnaires master table
CREATE TABLE IF NOT EXISTS public.mental_health_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- weekly | biweekly | monthly
  send_day INTEGER NOT NULL DEFAULT 5, -- 0 = dimanche
  send_time TIME NOT NULL DEFAULT '18:00:00',
  target_roles TEXT[] DEFAULT ARRAY['learner'],
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scoring_config JSONB,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS mental_health_questionnaires_org_id_idx
  ON public.mental_health_questionnaires (org_id);
CREATE INDEX IF NOT EXISTS mental_health_questionnaires_active_idx
  ON public.mental_health_questionnaires (org_id, is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.update_mental_health_questionnaires_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mental_health_questionnaires_updated_at ON public.mental_health_questionnaires;
CREATE TRIGGER mental_health_questionnaires_updated_at
  BEFORE UPDATE ON public.mental_health_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mental_health_questionnaires_updated_at();

ALTER TABLE public.mental_health_questionnaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins manage mental questionnaires" ON public.mental_health_questionnaires;
CREATE POLICY "Super admins manage mental questionnaires"
  ON public.mental_health_questionnaires
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = true
    )
  );

-- Questions table
CREATE TABLE IF NOT EXISTS public.mental_health_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.mental_health_questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  conditional_logic JSONB,
  options JSONB,
  likert_scale JSONB,
  scoring JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mental_health_questions_questionnaire_id_idx
  ON public.mental_health_questions (questionnaire_id);
CREATE INDEX IF NOT EXISTS mental_health_questions_order_idx
  ON public.mental_health_questions (questionnaire_id, order_index);

CREATE OR REPLACE FUNCTION public.update_mental_health_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mental_health_questions_updated_at ON public.mental_health_questions;
CREATE TRIGGER mental_health_questions_updated_at
  BEFORE UPDATE ON public.mental_health_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mental_health_questions_updated_at();

ALTER TABLE public.mental_health_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins manage mental questions" ON public.mental_health_questions;
CREATE POLICY "Super admins manage mental questions"
  ON public.mental_health_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = true
    )
  );

-- Responses table
CREATE TABLE IF NOT EXISTS public.mental_health_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.mental_health_questionnaires(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.mental_health_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  response_value TEXT,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS mental_health_responses_questionnaire_idx
  ON public.mental_health_responses (questionnaire_id);
CREATE INDEX IF NOT EXISTS mental_health_responses_user_idx
  ON public.mental_health_responses (user_id);

ALTER TABLE public.mental_health_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins view mental responses" ON public.mental_health_responses;
CREATE POLICY "Super admins view mental responses"
  ON public.mental_health_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = true
    )
  );

-- Assessments table
CREATE TABLE IF NOT EXISTS public.mental_health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.mental_health_questionnaires(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL,
  dimension_scores JSONB NOT NULL,
  analysis_summary TEXT,
  analysis_details JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mental_health_assessments_user_idx
  ON public.mental_health_assessments (user_id);
CREATE INDEX IF NOT EXISTS mental_health_assessments_org_idx
  ON public.mental_health_assessments (org_id);
CREATE INDEX IF NOT EXISTS mental_health_assessments_questionnaire_idx
  ON public.mental_health_assessments (questionnaire_id);

CREATE OR REPLACE FUNCTION public.update_mental_health_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mental_health_assessments_updated_at ON public.mental_health_assessments;
CREATE TRIGGER mental_health_assessments_updated_at
  BEFORE UPDATE ON public.mental_health_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mental_health_assessments_updated_at();

ALTER TABLE public.mental_health_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own mental assessments" ON public.mental_health_assessments;
CREATE POLICY "Users view own mental assessments"
  ON public.mental_health_assessments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Org managers view mental assessments" ON public.mental_health_assessments;
CREATE POLICY "Org managers view mental assessments"
  ON public.mental_health_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.org_id = org_id
        AND om.role IN ('admin', 'manager', 'instructor', 'formateur')
    )
  );

DROP POLICY IF EXISTS "Super admins manage mental assessments" ON public.mental_health_assessments;
CREATE POLICY "Super admins manage mental assessments"
  ON public.mental_health_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = true
    )
  );

-- Scheduler helper function (no jobs attached here)
CREATE OR REPLACE FUNCTION public.send_scheduled_mental_health_questionnaires()
RETURNS VOID AS $$
DECLARE
  questionnaire_record RECORD;
BEGIN
  FOR questionnaire_record IN
    SELECT * FROM public.mental_health_questionnaires
    WHERE is_active = true
  LOOP
    -- Placeholder for future scheduling logic
    RAISE NOTICE 'Questionnaire % ready to send', questionnaire_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

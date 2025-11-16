-- ============================================
-- TABLE POUR LES QUESTIONNAIRES DE SANTÉ MENTALE
-- ============================================
-- Cette table stocke les questionnaires de santé mentale
-- qui sont envoyés automatiquement en fin de semaine

-- Supprimer les objets existants si nécessaire
DROP POLICY IF EXISTS "Super admins can manage all questionnaires" ON public.mental_health_questionnaires;
DROP POLICY IF EXISTS "Admins can view their organization questionnaires" ON public.mental_health_questionnaires;
DROP TRIGGER IF EXISTS mental_health_questionnaires_updated_at ON public.mental_health_questionnaires;
DROP INDEX IF EXISTS mental_health_questionnaires_org_id_idx;
DROP INDEX IF EXISTS mental_health_questionnaires_active_idx;
DROP TABLE IF EXISTS public.mental_health_questionnaires CASCADE;

-- Créer la table
CREATE TABLE IF NOT EXISTS public.mental_health_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- 'weekly', 'biweekly', 'monthly'
  send_day INTEGER NOT NULL DEFAULT 5, -- 0 = Dimanche, 5 = Vendredi
  send_time TIME NOT NULL DEFAULT '18:00:00', -- Heure d'envoi (18h par défaut)
  target_roles TEXT[] DEFAULT ARRAY['learner'], 'student'], -- Rôles cibles
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scoring_config JSONB, -- Configuration du scoring (enabled, max_score, categories)
  metadata JSONB -- Stockage flexible pour des infos supplémentaires
);

-- Index
CREATE INDEX IF NOT EXISTS mental_health_questionnaires_org_id_idx 
  ON public.mental_health_questionnaires (org_id);
CREATE INDEX IF NOT EXISTS mental_health_questionnaires_active_idx 
  ON public.mental_health_questionnaires (org_id, is_active) 
  WHERE is_active = true;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_mental_health_questionnaires_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mental_health_questionnaires_updated_at
  BEFORE UPDATE ON public.mental_health_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_health_questionnaires_updated_at();

-- RLS Policies
ALTER TABLE public.mental_health_questionnaires ENABLE ROW LEVEL SECURITY;

-- Les super admins peuvent tout voir et modifier
CREATE POLICY "Super admins can manage all questionnaires"
  ON public.mental_health_questionnaires
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
    )
  );

-- Les admins d'organisation peuvent voir les questionnaires de leur organisation
CREATE POLICY "Admins can view their organization questionnaires"
  ON public.mental_health_questionnaires
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = mental_health_questionnaires.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Commentaires
COMMENT ON TABLE public.mental_health_questionnaires IS 'Questionnaires de santé mentale envoyés automatiquement';
COMMENT ON COLUMN public.mental_health_questionnaires.frequency IS 'Fréquence d''envoi: weekly, biweekly, monthly';
COMMENT ON COLUMN public.mental_health_questionnaires.send_day IS 'Jour d''envoi: 0 = Dimanche, 5 = Vendredi';
COMMENT ON COLUMN public.mental_health_questionnaires.target_roles IS 'Rôles cibles pour l''envoi du questionnaire';


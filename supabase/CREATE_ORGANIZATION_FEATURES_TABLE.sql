-- ============================================
-- TABLE POUR GÉRER LES FONCTIONNALITÉS PREMIUM PAR ORGANISATION
-- ============================================
-- Cette table permet de gérer quelles fonctionnalités sont activées
-- pour chaque organisation (ex: gamification, IA avancée, etc.)

-- Supprimer les politiques RLS existantes si elles existent
DROP POLICY IF EXISTS "Admins can view their organization features" ON public.organization_features;
DROP POLICY IF EXISTS "Super admins can manage all features" ON public.organization_features;

-- Supprimer la table si elle existe (optionnel, commenté pour préserver les données)
-- DROP TABLE IF EXISTS public.organization_features CASCADE;

-- Créer la table organization_features
CREATE TABLE IF NOT EXISTS public.organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL, -- Ex: 'gamification', 'ai_advanced', 'analytics_pro', etc.
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Qui a activé cette fonctionnalité
  expires_at TIMESTAMPTZ, -- Optionnel : date d'expiration pour les abonnements
  metadata JSONB, -- Stockage flexible pour des infos supplémentaires (plan, prix, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, feature_key)
);

-- Index pour des recherches rapides (supprimer d'abord s'ils existent)
DROP INDEX IF EXISTS organization_features_org_id_idx;
DROP INDEX IF EXISTS organization_features_feature_key_idx;
DROP INDEX IF EXISTS organization_features_enabled_idx;

CREATE INDEX IF NOT EXISTS organization_features_org_id_idx ON public.organization_features (org_id);
CREATE INDEX IF NOT EXISTS organization_features_feature_key_idx ON public.organization_features (feature_key);
CREATE INDEX IF NOT EXISTS organization_features_enabled_idx ON public.organization_features (org_id, is_enabled) WHERE is_enabled = true;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_organization_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà, puis le recréer
DROP TRIGGER IF EXISTS organization_features_updated_at ON public.organization_features;

CREATE TRIGGER organization_features_updated_at
  BEFORE UPDATE ON public.organization_features
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_features_updated_at();

-- RLS Policies
ALTER TABLE public.organization_features ENABLE ROW LEVEL SECURITY;

-- Les admins d'organisation peuvent voir les fonctionnalités de leur organisation
CREATE POLICY "Admins can view their organization features"
  ON public.organization_features
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = organization_features.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Les super admins peuvent tout voir et modifier
CREATE POLICY "Super admins can manage all features"
  ON public.organization_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
    )
  );

-- Fonction helper pour vérifier si une organisation a une fonctionnalité activée
DROP FUNCTION IF EXISTS public.has_feature(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.has_feature(
  p_org_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_features
    WHERE org_id = p_org_id
      AND feature_key = p_feature_key
      AND is_enabled = true
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour obtenir toutes les fonctionnalités d'une organisation
DROP FUNCTION IF EXISTS public.get_organization_features(UUID);

CREATE OR REPLACE FUNCTION public.get_organization_features(
  p_org_id UUID
)
RETURNS TABLE (
  feature_key TEXT,
  is_enabled BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    of.feature_key,
    of.is_enabled,
    of.expires_at
  FROM public.organization_features of
  WHERE of.org_id = p_org_id
    AND of.is_enabled = true
    AND (of.expires_at IS NULL OR of.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.organization_features IS 'Gère les fonctionnalités premium activées pour chaque organisation';
COMMENT ON COLUMN public.organization_features.feature_key IS 'Clé unique de la fonctionnalité (ex: gamification, ai_advanced)';
COMMENT ON COLUMN public.organization_features.is_enabled IS 'Si la fonctionnalité est activée';
COMMENT ON COLUMN public.organization_features.expires_at IS 'Date d''expiration optionnelle pour les abonnements temporaires';
COMMENT ON COLUMN public.organization_features.metadata IS 'Métadonnées flexibles (plan, prix, etc.)';


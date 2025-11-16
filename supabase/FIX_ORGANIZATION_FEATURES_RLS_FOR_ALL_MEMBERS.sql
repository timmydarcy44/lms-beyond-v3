-- Ajouter une politique RLS pour permettre à tous les membres de l'organisation
-- de voir les fonctionnalités activées (en lecture seule)

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Admins can view their organization features" ON public.organization_features;
DROP POLICY IF EXISTS "All organization members can view enabled features" ON public.organization_features;
DROP POLICY IF EXISTS "Super admins can manage all features" ON public.organization_features;
DROP POLICY IF EXISTS "Admins can update their organization features" ON public.organization_features;

-- Créer une nouvelle politique qui permet à tous les membres de l'organisation
-- de voir les fonctionnalités activées
CREATE POLICY "All organization members can view enabled features"
  ON public.organization_features
  FOR SELECT
  USING (
    is_enabled = true
    AND EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = organization_features.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Créer la politique pour les super admins
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

-- Ajouter une politique pour permettre aux admins de modifier les fonctionnalités
-- (mais pas aux autres membres)
CREATE POLICY "Admins can update their organization features"
  ON public.organization_features
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = organization_features.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );


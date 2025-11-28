-- ============================================
-- Script pour s'assurer que les RLS policies
-- permettent aux utilisateurs de lire les features
-- de leurs organisations
-- ============================================

-- 1. Vérifier les policies existantes
SELECT 
  'EXISTING POLICIES' as "Info",
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organization_features'
ORDER BY policyname;

-- 2. Créer une policy pour permettre aux utilisateurs de lire les features
--    des organisations où ils sont membres
DROP POLICY IF EXISTS organization_features_read_org_members ON public.organization_features;

CREATE POLICY organization_features_read_org_members ON public.organization_features
  FOR SELECT
  USING (
    -- L'utilisateur peut lire les features des organisations où il est membre
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = organization_features.org_id
        AND om.user_id = auth.uid()
    )
  );

-- 3. Vérifier que la policy a été créée
SELECT 
  'POLICY CREATED' as "Info",
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'organization_features'
  AND policyname = 'organization_features_read_org_members';

-- 4. Commentaire
COMMENT ON POLICY organization_features_read_org_members ON public.organization_features IS 
  'Permet aux utilisateurs de lire les features des organisations où ils sont membres.';


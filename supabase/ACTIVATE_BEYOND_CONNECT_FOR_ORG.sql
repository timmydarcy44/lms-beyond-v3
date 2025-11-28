-- ============================================
-- Script pour activer Beyond Connect pour l'organisation "Beyond Center Demo"
-- ============================================

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
BEGIN
  -- Récupérer l'organisation "Beyond Center Demo"
  SELECT id INTO v_org_id
  FROM organizations
  WHERE name = 'Beyond Center Demo'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Organisation "Beyond Center Demo" non trouvée.';
    RETURN;
  END IF;

  -- Récupérer l'admin
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@beyondcenter.fr'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Admin admin@beyondcenter.fr non trouvé.';
    RETURN;
  END IF;

  -- Activer Beyond Connect pour l'organisation
  INSERT INTO public.organization_features (
    org_id,
    feature_key,
    is_enabled,
    enabled_at,
    enabled_by,
    created_at,
    updated_at
  ) VALUES (
    v_org_id,
    'beyond_connect',
    true,
    NOW(),
    v_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (org_id, feature_key) DO UPDATE
  SET is_enabled = true,
      enabled_at = NOW(),
      enabled_by = v_admin_id,
      updated_at = NOW();

  RAISE NOTICE '✅ Beyond Connect activé pour l''organisation "Beyond Center Demo"';
END $$;


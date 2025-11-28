-- ============================================
-- Script pour s'assurer que Beyond Connect est activé
-- pour l'organisation "Beyond Center Demo" et que
-- Alfred et Bruce ont bien accès
-- ============================================

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
  v_bruce_id UUID;
  v_has_feature BOOLEAN;
BEGIN
  -- 1. Récupérer l'organisation
  SELECT id INTO v_org_id
  FROM organizations
  WHERE name = 'Beyond Center Demo'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organisation "Beyond Center Demo" non trouvée. Exécutez d''abord create-bruce-wayne-beyond-care.js';
  END IF;

  RAISE NOTICE '✅ Organisation trouvée: %', v_org_id;

  -- 2. Récupérer Alfred (admin)
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@beyondcenter.fr'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Alfred (admin@beyondcenter.fr) non trouvé. Exécutez d''abord create-bruce-wayne-beyond-care.js';
  END IF;

  RAISE NOTICE '✅ Alfred trouvé: %', v_admin_id;

  -- 3. Récupérer Bruce (apprenant)
  SELECT id INTO v_bruce_id
  FROM auth.users
  WHERE email = 'demo@beyondcenter.fr'
  LIMIT 1;

  IF v_bruce_id IS NULL THEN
    RAISE EXCEPTION 'Bruce (demo@beyondcenter.fr) non trouvé. Exécutez d''abord create-bruce-wayne-beyond-care.js';
  END IF;

  RAISE NOTICE '✅ Bruce trouvé: %', v_bruce_id;

  -- 4. Vérifier si Beyond Connect est activé
  SELECT is_enabled INTO v_has_feature
  FROM organization_features
  WHERE org_id = v_org_id
    AND feature_key = 'beyond_connect'
  LIMIT 1;

  -- 5. Activer Beyond Connect si ce n'est pas déjà fait
  IF v_has_feature IS NULL OR v_has_feature = false THEN
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

    RAISE NOTICE '✅ Beyond Connect activé pour l''organisation';
  ELSE
    RAISE NOTICE '✅ Beyond Connect est déjà activé';
  END IF;

  -- 6. Vérifier que Alfred est admin de l'organisation
  IF NOT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_id = v_org_id
      AND user_id = v_admin_id
      AND role = 'admin'
  ) THEN
    INSERT INTO public.org_memberships (
      org_id,
      user_id,
      role
    ) VALUES (
      v_org_id,
      v_admin_id,
      'admin'
    )
    ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = 'admin';

    RAISE NOTICE '✅ Alfred ajouté comme admin de l''organisation';
  ELSE
    RAISE NOTICE '✅ Alfred est déjà admin de l''organisation';
  END IF;

  -- 7. Vérifier que Bruce est apprenant de l'organisation
  IF NOT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_id = v_org_id
      AND user_id = v_bruce_id
      AND role = 'learner'
  ) THEN
    INSERT INTO public.org_memberships (
      org_id,
      user_id,
      role
    ) VALUES (
      v_org_id,
      v_bruce_id,
      'learner'
    )
    ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = 'learner';

    RAISE NOTICE '✅ Bruce ajouté comme apprenant de l''organisation';
  ELSE
    RAISE NOTICE '✅ Bruce est déjà apprenant de l''organisation';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CONFIGURATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Alfred (admin@beyondcenter.fr) peut maintenant accéder à Beyond Connect via /admin/beyond-connect';
  RAISE NOTICE 'Bruce (demo@beyondcenter.fr) peut maintenant accéder à Beyond Connect via /beyond-connect-app';
END $$;


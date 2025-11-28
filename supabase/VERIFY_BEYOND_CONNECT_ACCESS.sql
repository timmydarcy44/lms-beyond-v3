-- ============================================
-- Script pour vérifier l'accès à Beyond Connect
-- pour l'organisation "Beyond Center Demo", Alfred et Bruce
-- ============================================

-- 1. Vérifier l'organisation
SELECT 
  'ORGANISATION' as "Type",
  id,
  name,
  slug
FROM organizations
WHERE name = 'Beyond Center Demo' OR slug = 'beyond-center-demo';

-- 2. Vérifier les utilisateurs
SELECT 
  'UTILISATEURS' as "Type",
  u.id,
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN ('admin@beyondcenter.fr', 'demo@beyondcenter.fr')
ORDER BY u.email;

-- 3. Vérifier les membreships
SELECT 
  'MEMBERSHIPS' as "Type",
  om.user_id,
  u.email,
  om.org_id,
  o.name as org_name,
  om.role as membership_role
FROM org_memberships om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.org_id
WHERE u.email IN ('admin@beyondcenter.fr', 'demo@beyondcenter.fr')
  AND o.name = 'Beyond Center Demo'
ORDER BY u.email, om.role;

-- 4. Vérifier Beyond Connect activé
SELECT 
  'BEYOND_CONNECT_FEATURE' as "Type",
  of.org_id,
  o.name as org_name,
  of.feature_key,
  of.is_enabled,
  of.enabled_at,
  of.enabled_by,
  u.email as enabled_by_email
FROM organization_features of
JOIN organizations o ON o.id = of.org_id
LEFT JOIN auth.users u ON u.id = of.enabled_by
WHERE o.name = 'Beyond Center Demo'
  AND of.feature_key = 'beyond_connect';

-- 5. Résumé
DO $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_admin_id UUID;
  v_bruce_id UUID;
  v_has_feature BOOLEAN;
  v_admin_membership BOOLEAN;
  v_bruce_membership BOOLEAN;
BEGIN
  -- Récupérer l'organisation
  SELECT id, name INTO v_org_id, v_org_name
  FROM organizations
  WHERE name = 'Beyond Center Demo'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE '❌ Organisation "Beyond Center Demo" non trouvée';
  ELSE
    RAISE NOTICE '✅ Organisation trouvée: % (ID: %)', v_org_name, v_org_id;
  END IF;

  -- Récupérer Alfred
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@beyondcenter.fr'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE '❌ Alfred (admin@beyondcenter.fr) non trouvé';
  ELSE
    RAISE NOTICE '✅ Alfred trouvé (ID: %)', v_admin_id;
  END IF;

  -- Récupérer Bruce
  SELECT id INTO v_bruce_id
  FROM auth.users
  WHERE email = 'demo@beyondcenter.fr'
  LIMIT 1;

  IF v_bruce_id IS NULL THEN
    RAISE NOTICE '❌ Bruce (demo@beyondcenter.fr) non trouvé';
  ELSE
    RAISE NOTICE '✅ Bruce trouvé (ID: %)', v_bruce_id;
  END IF;

  -- Vérifier Beyond Connect
  IF v_org_id IS NOT NULL THEN
    SELECT is_enabled INTO v_has_feature
    FROM organization_features
    WHERE org_id = v_org_id
      AND feature_key = 'beyond_connect'
    LIMIT 1;

    IF v_has_feature IS NULL OR v_has_feature = false THEN
      RAISE NOTICE '❌ Beyond Connect NON activé pour l''organisation';
    ELSE
      RAISE NOTICE '✅ Beyond Connect activé pour l''organisation';
    END IF;
  END IF;

  -- Vérifier membership d'Alfred
  IF v_org_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM org_memberships
      WHERE org_id = v_org_id
        AND user_id = v_admin_id
        AND role = 'admin'
    ) INTO v_admin_membership;

    IF v_admin_membership THEN
      RAISE NOTICE '✅ Alfred est admin de l''organisation';
    ELSE
      RAISE NOTICE '❌ Alfred n''est PAS admin de l''organisation';
    END IF;
  END IF;

  -- Vérifier membership de Bruce
  IF v_org_id IS NOT NULL AND v_bruce_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM org_memberships
      WHERE org_id = v_org_id
        AND user_id = v_bruce_id
        AND role = 'learner'
    ) INTO v_bruce_membership;

    IF v_bruce_membership THEN
      RAISE NOTICE '✅ Bruce est apprenant de l''organisation';
    ELSE
      RAISE NOTICE '❌ Bruce n''est PAS apprenant de l''organisation';
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ:';
  RAISE NOTICE '========================================';
  IF v_org_id IS NOT NULL AND v_admin_id IS NOT NULL AND v_bruce_id IS NOT NULL 
     AND v_has_feature = true AND v_admin_membership = true AND v_bruce_membership = true THEN
    RAISE NOTICE '✅ TOUT EST CONFIGURÉ CORRECTEMENT';
  ELSE
    RAISE NOTICE '❌ CONFIGURATION INCOMPLÈTE - Exécutez les scripts nécessaires';
  END IF;
END $$;


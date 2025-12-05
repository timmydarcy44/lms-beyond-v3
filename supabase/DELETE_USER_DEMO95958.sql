-- Script pour supprimer l'utilisateur demo95958@gmail.com
-- ============================================================================

-- 1. Trouver l'ID de l'utilisateur
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur depuis profiles
  SELECT id INTO user_id_var
  FROM public.profiles
  WHERE email = 'demo95958@gmail.com'
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RAISE NOTICE 'Utilisateur demo95958@gmail.com non trouvé dans profiles';
  ELSE
    RAISE NOTICE 'Utilisateur trouvé avec ID: %', user_id_var;

    -- Supprimer les accès au catalogue
    DELETE FROM public.catalog_access
    WHERE user_id = user_id_var;
    RAISE NOTICE 'Accès au catalogue supprimés';

    -- Supprimer les résultats de tests
    DELETE FROM public.test_attempts
    WHERE user_id = user_id_var;
    RAISE NOTICE 'Résultats de tests supprimés';

    -- Supprimer les évaluations de santé mentale
    DELETE FROM public.mental_health_assessments
    WHERE user_id = user_id_var;
    RAISE NOTICE 'Évaluations de santé mentale supprimées';

    -- Supprimer les membreships d'organisation
    DELETE FROM public.org_memberships
    WHERE user_id = user_id_var;
    RAISE NOTICE 'Memberships d''organisation supprimés';

    -- Supprimer le profil
    DELETE FROM public.profiles
    WHERE id = user_id_var;
    RAISE NOTICE 'Profil supprimé';

    RAISE NOTICE '✅ Toutes les données de demo95958@gmail.com ont été supprimées (ID: %)', user_id_var;
    RAISE NOTICE '⚠️  Pour supprimer l''utilisateur de auth.users, utilisez l''API admin de Supabase:';
    RAISE NOTICE '    supabase.auth.admin.deleteUser(''%'')', user_id_var;
  END IF;
END $$;

-- 2. Vérifier que tout a été supprimé
SELECT 
  'Profiles' as table_name,
  COUNT(*) as remaining_records
FROM public.profiles
WHERE email = 'demo95958@gmail.com'

UNION ALL

SELECT 
  'Catalog Access' as table_name,
  COUNT(*) as remaining_records
FROM public.catalog_access ca
JOIN public.profiles p ON p.id = ca.user_id
WHERE p.email = 'demo95958@gmail.com'

UNION ALL

SELECT 
  'Test Attempts' as table_name,
  COUNT(*) as remaining_records
FROM public.test_attempts ta
JOIN public.profiles p ON p.id = ta.user_id
WHERE p.email = 'demo95958@gmail.com'

UNION ALL

SELECT 
  'Mental Health Assessments' as table_name,
  COUNT(*) as remaining_records
FROM public.mental_health_assessments mha
JOIN public.profiles p ON p.id = mha.user_id
WHERE p.email = 'demo95958@gmail.com';


-- Script de vérification pour Beyond Connect
-- Exécutez ce script pour vérifier que toutes les tables Beyond Connect existent

-- 1. Vérifier toutes les tables Beyond Connect
SELECT 
  'Tables Beyond Connect' as check_type,
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    )
    THEN '✅ Existe'
    ELSE '❌ MANQUANTE'
  END as status
FROM (
  VALUES 
    ('beyond_connect_experiences'),
    ('beyond_connect_education'),
    ('beyond_connect_skills'),
    ('beyond_connect_certifications'),
    ('beyond_connect_projects'),
    ('beyond_connect_languages'),
    ('beyond_connect_companies'),
    ('beyond_connect_job_offers'),
    ('beyond_connect_applications'),
    ('beyond_connect_cv_library'),
    ('beyond_connect_matches'),
    ('beyond_connect_profile_settings')
) AS t(table_name)
ORDER BY table_name;

-- 2. Vérifier les vues Beyond Connect
SELECT 
  'Vues Beyond Connect' as check_type,
  view_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = v.view_name
    )
    THEN '✅ Existe'
    ELSE '❌ MANQUANTE'
  END as status
FROM (
  VALUES 
    ('beyond_connect_user_badges'),
    ('beyond_connect_test_results'),
    ('beyond_connect_user_profiles')
) AS v(view_name)
ORDER BY view_name;

-- 3. Vérifier les colonnes importantes dans beyond_connect_job_offers
SELECT 
  'Colonnes beyond_connect_job_offers' as check_type,
  column_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'beyond_connect_job_offers'
      AND column_name = c.column_name
    )
    THEN '✅ Existe'
    ELSE '❌ MANQUANTE'
  END as status
FROM (
  VALUES 
    ('hours_per_week'),
    ('required_soft_skills'),
    ('company_presentation'),
    ('description')
) AS c(column_name)
ORDER BY column_name;

-- 4. Résumé
SELECT 
  'Résumé' as check_type,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = t.table_name
  )) || ' / ' || COUNT(*) || ' tables créées' as status
FROM (
  VALUES 
    ('beyond_connect_experiences'),
    ('beyond_connect_education'),
    ('beyond_connect_skills'),
    ('beyond_connect_certifications'),
    ('beyond_connect_projects'),
    ('beyond_connect_languages'),
    ('beyond_connect_companies'),
    ('beyond_connect_job_offers'),
    ('beyond_connect_applications'),
    ('beyond_connect_cv_library'),
    ('beyond_connect_matches'),
    ('beyond_connect_profile_settings')
) AS t(table_name);


-- ============================================
-- VÉRIFICATION DE LA MIGRATION
-- ============================================
-- Ce script vérifie que toutes les colonnes/tables manquantes ont été ajoutées
-- Usage: Exécuter dans Supabase Studio SQL Editor
-- ============================================

-- ============================================
-- 1. VÉRIFICATION DES COLONNES AJOUTÉES
-- ============================================

-- Courses
SELECT 
  'COURSES_COLUMNS' as "Type",
  'courses' as "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'org_id') 
      THEN '✅ org_id existe'
    ELSE '❌ org_id MANQUANT'
  END as "org_id",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'created_by') 
      THEN '✅ created_by existe'
    ELSE '❌ created_by MANQUANT'
  END as "created_by";

-- Paths
SELECT 
  'PATHS_COLUMNS' as "Type",
  'paths' as "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paths' AND column_name = 'org_id') 
      THEN '✅ org_id existe'
    ELSE '❌ org_id MANQUANT'
  END as "org_id";

-- Resources
SELECT 
  'RESOURCES_COLUMNS' as "Type",
  'resources' as "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'slug') 
      THEN '✅ slug existe'
    ELSE '❌ slug MANQUANT'
  END as "slug",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'status') 
      THEN '✅ status existe'
    ELSE '❌ status MANQUANT'
  END as "status";

-- Tests
SELECT 
  'TESTS_COLUMNS' as "Type",
  'tests' as "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'creator_id') 
      THEN '✅ creator_id existe'
    ELSE '❌ creator_id MANQUANT'
  END as "creator_id";

-- ============================================
-- 2. VÉRIFICATION DES INDEX CRÉÉS
-- ============================================

SELECT 
  'INDEXES' as "Type",
  tablename as "Table",
  indexname as "Index",
  CASE 
    WHEN indexname LIKE '%org_id%' OR indexname LIKE '%created_by%' OR indexname LIKE '%creator_id%' OR indexname LIKE '%slug%'
      THEN '✅ Index ajouté'
    ELSE 'Index existant'
  END as "Statut"
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    (tablename = 'courses' AND (indexname LIKE '%org_id%' OR indexname LIKE '%created_by%'))
    OR (tablename = 'paths' AND indexname LIKE '%org_id%')
    OR (tablename = 'resources' AND (indexname LIKE '%slug%'))
    OR (tablename = 'tests' AND indexname LIKE '%creator_id%')
  )
ORDER BY tablename, indexname;

-- ============================================
-- 3. VÉRIFICATION DE LA TABLE LEARNING_SESSIONS
-- ============================================

SELECT 
  'LEARNING_SESSIONS' as "Type",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_sessions')
      THEN '✅ Table learning_sessions existe'
    ELSE '❌ Table learning_sessions MANQUANTE'
  END as "Statut",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_sessions')
      THEN (
        SELECT COUNT(*)::text || ' colonnes' 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'learning_sessions'
      )
    ELSE 'N/A'
  END as "Détails";

-- ============================================
-- 4. VÉRIFICATION DES DONNÉES SYNCHRONISÉES
-- ============================================

-- Vérifier que created_by est synchronisé avec creator_id dans courses
SELECT 
  'DATA_SYNC_COURSES' as "Type",
  COUNT(*) FILTER (WHERE created_by IS NULL AND creator_id IS NOT NULL) as "created_by NULL alors que creator_id existe",
  COUNT(*) FILTER (WHERE created_by IS NOT NULL AND creator_id IS NOT NULL AND created_by != creator_id) as "Incohérences created_by vs creator_id"
FROM courses;

-- Vérifier que creator_id est synchronisé avec created_by dans tests
SELECT 
  'DATA_SYNC_TESTS' as "Type",
  COUNT(*) FILTER (WHERE creator_id IS NULL AND created_by IS NOT NULL) as "creator_id NULL alors que created_by existe",
  COUNT(*) FILTER (WHERE creator_id IS NOT NULL AND created_by IS NOT NULL AND creator_id != created_by) as "Incohérences creator_id vs created_by"
FROM tests;

-- Vérifier que status est synchronisé avec published dans resources
SELECT 
  'DATA_SYNC_RESOURCES' as "Type",
  COUNT(*) FILTER (WHERE status IS NULL) as "status NULL",
  COUNT(*) FILTER (WHERE published = true AND status != 'published') as "Incohérences published vs status"
FROM resources;

-- Vérifier que learner_id et user_id sont synchronisés dans enrollments
SELECT 
  'DATA_SYNC_ENROLLMENTS' as "Type",
  COUNT(*) FILTER (WHERE user_id IS NULL AND learner_id IS NOT NULL) as "user_id NULL alors que learner_id existe",
  COUNT(*) FILTER (WHERE user_id IS NOT NULL AND learner_id IS NOT NULL AND user_id != learner_id) as "Incohérences user_id vs learner_id"
FROM enrollments;

-- ============================================
-- 5. RÉSUMÉ FINAL
-- ============================================

SELECT 
  'SUMMARY' as "Type",
  'Résumé de la Migration' as "Section",
  (
    SELECT COUNT(*)::text
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'courses' AND column_name IN ('org_id', 'created_by'))
        OR (table_name = 'paths' AND column_name = 'org_id')
        OR (table_name = 'resources' AND column_name IN ('slug', 'status'))
        OR (table_name = 'tests' AND column_name = 'creator_id')
      )
  ) || ' colonnes ajoutées' as "Colonnes",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_sessions')
      THEN '✅ Table learning_sessions créée'
    ELSE '❌ Table learning_sessions manquante'
  END as "Table",
  (
    SELECT COUNT(*)::text
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND (
        (tablename = 'courses' AND (indexname LIKE '%org_id%' OR indexname LIKE '%created_by%'))
        OR (tablename = 'paths' AND indexname LIKE '%org_id%')
        OR (tablename = 'resources' AND indexname LIKE '%slug%')
        OR (tablename = 'tests' AND indexname LIKE '%creator_id%')
      )
  ) || ' index(es) créé(s)' as "Indexes";

-- Message final
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VÉRIFICATION TERMINÉE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Vérifiez les résultats ci-dessus.';
  RAISE NOTICE 'Tous les éléments doivent être marqués ✅';
END $$;




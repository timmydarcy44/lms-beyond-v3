-- ============================================
-- AUDIT COMPLET DE LA STRUCTURE DE LA BASE
-- ============================================
-- Ce script analyse :
-- 1. Les tables et leurs colonnes
-- 2. Les clés primaires et contraintes uniques
-- 3. Les Foreign Keys
-- 4. Les RLS policies
-- 5. Les incohérences détectées
-- ============================================

-- ============================================
-- 1. TABLES ET COLONNES
-- ============================================
SELECT 
  'TABLE_STRUCTURE' as "Type",
  table_name as "Table",
  column_name as "Colonne",
  data_type as "Type",
  is_nullable as "Nullable",
  column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'enrollments', 'courses', 'paths', 'resources', 'tests',
    'profiles', 'organizations', 'org_memberships', 'groups',
    'path_progress', 'resource_views', 'test_attempts',
    'sections', 'chapters', 'course_progress'
  )
ORDER BY table_name, ordinal_position;

-- ============================================
-- 2. CLÉS PRIMAIRES ET CONTRAINTES UNIQUES
-- ============================================
SELECT 
  'PRIMARY_KEY' as "Type",
  tc.table_name as "Table",
  kcu.column_name as "Colonnes",
  tc.constraint_name as "Contrainte"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name IN (
    'enrollments', 'courses', 'paths', 'resources', 'tests',
    'profiles', 'organizations', 'org_memberships', 'groups',
    'path_progress', 'resource_views', 'test_attempts'
  )
ORDER BY tc.table_name, kcu.ordinal_position;

-- Contraintes UNIQUES
SELECT 
  'UNIQUE_CONSTRAINT' as "Type",
  tc.table_name as "Table",
  kcu.column_name as "Colonnes",
  tc.constraint_name as "Contrainte"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN (
    'enrollments', 'courses', 'paths', 'resources', 'tests',
    'profiles', 'organizations', 'org_memberships'
  )
ORDER BY tc.table_name, kcu.ordinal_position;

-- ============================================
-- 3. FOREIGN KEYS
-- ============================================
SELECT 
  'FOREIGN_KEY' as "Type",
  tc.table_name as "Table Source",
  kcu.column_name as "Colonne Source",
  ccu.table_name as "Table Cible",
  ccu.column_name as "Colonne Cible",
  tc.constraint_name as "Contrainte"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'enrollments', 'courses', 'paths', 'resources', 'tests',
    'profiles', 'organizations', 'org_memberships', 'groups',
    'path_progress', 'resource_views', 'test_attempts',
    'sections', 'chapters'
  )
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 4. RLS POLICIES
-- ============================================
SELECT 
  'RLS_POLICY' as "Type",
  schemaname as "Schema",
  tablename as "Table",
  policyname as "Policy",
  cmd as "Command",
  qual as "Using",
  with_check as "With Check",
  roles as "Roles"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'enrollments', 'courses', 'paths', 'resources', 'tests',
    'profiles', 'organizations', 'org_memberships', 'groups',
    'path_progress', 'resource_views', 'test_attempts'
  )
ORDER BY tablename, policyname;

-- ============================================
-- 5. INCOHÉRENCES DÉTECTÉES
-- ============================================

-- Vérifier si enrollments a learner_id OU user_id (ou les deux)
SELECT 
  'INCOHERENCE_ENROLLMENTS' as "Type",
  'enrollments' as "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'learner_id') 
         AND EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'enrollments' AND column_name = 'user_id')
    THEN 'A LES DEUX COLONNES (learner_id ET user_id)'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'learner_id')
    THEN 'UTILISE learner_id SEULEMENT'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'user_id')
    THEN 'UTILISE user_id SEULEMENT'
    ELSE 'AUCUNE COLONNE TROUVÉE'
  END as "Statut"
FROM information_schema.tables
WHERE table_name = 'enrollments';

-- Vérifier la clé primaire de enrollments
SELECT 
  'INCOHERENCE_PK_ENROLLMENTS' as "Type",
  tc.table_name as "Table",
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as "Clé Primaire"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name = 'enrollments'
GROUP BY tc.table_name;

-- Vérifier les policies RLS qui utilisent user_id vs learner_id
SELECT 
  'INCOHERENCE_POLICY' as "Type",
  tablename as "Table",
  policyname as "Policy",
  CASE 
    WHEN qual LIKE '%user_id%' AND qual NOT LIKE '%learner_id%' THEN 'Utilise user_id uniquement'
    WHEN qual LIKE '%learner_id%' AND qual NOT LIKE '%user_id%' THEN 'Utilise learner_id uniquement'
    WHEN qual LIKE '%user_id%' AND qual LIKE '%learner_id%' THEN 'Utilise les deux'
    ELSE 'N''utilise ni l''un ni l''autre'
  END as "Statut",
  qual as "Condition"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'enrollments'
  AND (qual LIKE '%user_id%' OR qual LIKE '%learner_id%');

-- Vérifier les colonnes creator_id vs owner_id vs created_by
SELECT 
  'INCOHERENCE_OWNERSHIP' as "Type",
  table_name as "Table",
  STRING_AGG(column_name, ', ' ORDER BY column_name) as "Colonnes de propriété"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('courses', 'paths', 'resources', 'tests')
  AND column_name IN ('creator_id', 'owner_id', 'created_by', 'author_id')
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 6. RÉSUMÉ DES TABLES IMPORTANTES
-- ============================================
SELECT 
  'SUMMARY' as "Type",
  table_name as "Table",
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as "Nombre Colonnes",
  (SELECT COUNT(*) FROM pg_policies 
   WHERE tablename = t.table_name AND schemaname = 'public') as "Nombre Policies",
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE table_name = t.table_name 
     AND constraint_type = 'PRIMARY KEY' 
     AND table_schema = 'public') as "Clés Primaire",
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE table_name = t.table_name 
     AND constraint_type = 'FOREIGN KEY' 
     AND table_schema = 'public') as "Foreign Keys"
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'enrollments', 'courses', 'paths', 'resources', 'tests',
    'profiles', 'organizations', 'org_memberships', 'groups',
    'path_progress', 'resource_views', 'test_attempts'
  )
ORDER BY table_name;

RAISE NOTICE '✓ Audit terminé. Vérifiez les résultats ci-dessus pour identifier les incohérences.';




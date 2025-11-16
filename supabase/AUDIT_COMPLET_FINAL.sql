-- ============================================
-- AUDIT COMPLET DE LA BASE DE DONNÉES
-- ============================================
-- Ce script analyse toutes les tables et identifie les problèmes
-- À exécuter dans Supabase Studio SQL Editor
-- ============================================

-- ============================================
-- 1. LISTE DE TOUTES LES TABLES UTILISÉES DANS LE CODE
-- ============================================
SELECT 
  'TABLES_LIST' as "Type",
  table_name as "Table",
  CASE 
    WHEN table_name IN ('profiles', 'courses', 'paths', 'resources', 'tests', 
                        'enrollments', 'organizations', 'org_memberships', 
                        'groups', 'group_members', 'path_progress', 
                        'resource_views', 'test_attempts', 'sections', 
                        'chapters', 'course_progress', 'login_events', 
                        'learning_sessions', 'drive_documents', 'drive_folders',
                        'path_courses', 'path_tests', 'path_resources',
                        'content_assignments', 'super_admins')
    THEN '✓ Table référencée dans le code'
    ELSE '⚠ Table non référencée'
  END as "Statut"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. STRUCTURE COMPLÈTE DES TABLES PRINCIPALES
-- ============================================
SELECT 
  'TABLE_COLUMNS' as "Type",
  table_name as "Table",
  column_name as "Colonne",
  data_type as "Type",
  is_nullable as "Nullable",
  column_default as "Default",
  CASE 
    WHEN table_name = 'profiles' AND column_name IN ('email', 'full_name', 'first_name', 'last_name', 'phone', 'avatar_url')
      THEN '⚠ Utilisée par le code mais peut manquer'
    WHEN table_name = 'courses' AND column_name IN ('cover_image', 'modules_count', 'duration_minutes', 'category', 'org_id', 'owner_id', 'created_by')
      THEN '⚠ Utilisée par le code mais peut manquer'
    WHEN table_name = 'paths' AND column_name IN ('org_id', 'owner_id', 'creator_id')
      THEN '⚠ Utilisée par le code mais peut manquer'
    WHEN table_name = 'resources' AND column_name IN ('org_id', 'created_by', 'owner_id', 'kind', 'published')
      THEN '⚠ Utilisée par le code mais peut manquer'
    WHEN table_name = 'tests' AND column_name IN ('org_id', 'creator_id', 'owner_id', 'published')
      THEN '⚠ Utilisée par le code mais peut manquer'
    WHEN table_name = 'enrollments' AND column_name IN ('learner_id', 'user_id')
      THEN '⚠ Incohérence potentielle (learner_id vs user_id)'
    ELSE '✓ OK'
  END as "Note"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'courses', 'paths', 'resources', 'tests',
    'enrollments', 'organizations', 'org_memberships',
    'groups', 'group_members', 'path_progress',
    'resource_views', 'test_attempts', 'sections',
    'course_progress', 'path_courses', 'path_tests',
    'path_resources', 'content_assignments', 'super_admins',
    'login_events', 'learning_sessions', 'drive_documents', 'drive_folders'
  )
ORDER BY table_name, ordinal_position;

-- ============================================
-- 3. COLONNES MANQUANTES DANS PROFILES
-- ============================================
SELECT 
  'MISSING_COLUMNS_PROFILES' as "Type",
  'profiles' as "Table",
  column_name as "Colonne Manquante",
  CASE column_name
    WHEN 'email' THEN 'text - Utilisée dans session.ts, queries'
    WHEN 'full_name' THEN 'text - Utilisée dans session.ts, admin.ts, super-admin.ts'
    WHEN 'first_name' THEN 'text - Utilisée dans admin.ts, actions'
    WHEN 'last_name' THEN 'text - Utilisée dans admin.ts, actions'
    WHEN 'phone' THEN 'text - Utilisée dans actions.ts'
    WHEN 'avatar_url' THEN 'text - Utilisée dans session.ts'
    ELSE 'À vérifier'
  END as "Usage"
FROM (
  VALUES 
    ('email'),
    ('full_name'),
    ('first_name'),
    ('last_name'),
    ('phone'),
    ('avatar_url')
) AS expected_columns(column_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = expected_columns.column_name
);

-- ============================================
-- 4. COLONNES MANQUANTES DANS COURSES
-- ============================================
SELECT 
  'MISSING_COLUMNS_COURSES' as "Type",
  'courses' as "Table",
  column_name as "Colonne Manquante",
  CASE column_name
    WHEN 'cover_image' THEN 'text - Utilisée dans formateur.ts, apprenant.ts'
    WHEN 'modules_count' THEN 'integer - Utilisée dans apprenant.ts'
    WHEN 'duration_minutes' THEN 'integer - Utilisée dans apprenant.ts, formateur.ts'
    WHEN 'duration_label' THEN 'text - Utilisée dans formateur.ts'
    WHEN 'category' THEN 'text - Utilisée dans apprenant.ts'
    WHEN 'org_id' THEN 'uuid - Utilisée dans super-admin.ts, formateur.ts'
    WHEN 'owner_id' THEN 'uuid - Utilisée dans super-admin.ts, formateur.ts'
    WHEN 'created_by' THEN 'uuid - Utilisée dans queries'
    ELSE 'À vérifier'
  END as "Usage"
FROM (
  VALUES 
    ('cover_image'),
    ('modules_count'),
    ('duration_minutes'),
    ('duration_label'),
    ('category'),
    ('org_id'),
    ('owner_id'),
    ('created_by')
) AS expected_columns(column_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'courses' 
    AND column_name = expected_columns.column_name
);

-- ============================================
-- 5. COLONNES MANQUANTES DANS PATHS
-- ============================================
SELECT 
  'MISSING_COLUMNS_PATHS' as "Type",
  'paths' as "Table",
  column_name as "Colonne Manquante",
  CASE column_name
    WHEN 'org_id' THEN 'uuid - Utilisée dans super-admin.ts, formateur.ts'
    WHEN 'owner_id' THEN 'uuid - Utilisée dans super-admin.ts, formateur.ts'
    WHEN 'creator_id' THEN 'uuid - Utilisée dans queries'
    ELSE 'À vérifier'
  END as "Usage"
FROM (
  VALUES 
    ('org_id'),
    ('owner_id'),
    ('creator_id')
) AS expected_columns(column_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'paths' 
    AND column_name = expected_columns.column_name
);

-- ============================================
-- 6. COLONNES MANQUANTES DANS RESOURCES
-- ============================================
SELECT 
  'MISSING_COLUMNS_RESOURCES' as "Type",
  'resources' as "Table",
  column_name as "Colonne Manquante",
  CASE column_name
    WHEN 'org_id' THEN 'uuid - Utilisée dans super-admin.ts'
    WHEN 'created_by' THEN 'uuid - Utilisée dans queries'
    WHEN 'owner_id' THEN 'uuid - Utilisée dans queries'
    WHEN 'kind' THEN 'resource_kind (ENUM) - Utilisée dans queries'
    WHEN 'published' THEN 'boolean - Utilisée dans queries'
    WHEN 'slug' THEN 'text - Utilisée dans queries'
    WHEN 'status' THEN 'text - Utilisée dans queries'
    ELSE 'À vérifier'
  END as "Usage"
FROM (
  VALUES 
    ('org_id'),
    ('created_by'),
    ('owner_id'),
    ('kind'),
    ('published'),
    ('slug'),
    ('status')
) AS expected_columns(column_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'resources' 
    AND column_name = expected_columns.column_name
);

-- ============================================
-- 7. COLONNES MANQUANTES DANS TESTS
-- ============================================
SELECT 
  'MISSING_COLUMNS_TESTS' as "Type",
  'tests' as "Table",
  column_name as "Colonne Manquante",
  CASE column_name
    WHEN 'org_id' THEN 'uuid - Utilisée dans super-admin.ts'
    WHEN 'creator_id' THEN 'uuid - Utilisée dans queries'
    WHEN 'owner_id' THEN 'uuid - Utilisée dans queries'
    WHEN 'published' THEN 'boolean - Utilisée dans queries'
    ELSE 'À vérifier'
  END as "Usage"
FROM (
  VALUES 
    ('org_id'),
    ('creator_id'),
    ('owner_id'),
    ('published')
) AS expected_columns(column_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'tests' 
    AND column_name = expected_columns.column_name
);

-- ============================================
-- 8. INCOHÉRENCE ENROLLMENTS (learner_id vs user_id)
-- ============================================
SELECT 
  'ENROLLMENTS_INCOHERENCE' as "Type",
  'enrollments' as "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'learner_id')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id')
    THEN '⚠ A LES DEUX COLONNES (learner_id ET user_id) - INCOHÉRENCE'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'learner_id')
    THEN '✓ Utilise learner_id uniquement'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id')
    THEN '⚠ Utilise user_id (devrait être learner_id?)'
    ELSE '❌ AUCUNE COLONNE TROUVÉE'
  END as "Statut",
  STRING_AGG(column_name, ', ') as "Colonnes Trouvées"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'enrollments'
  AND column_name IN ('learner_id', 'user_id')
GROUP BY table_name;

-- ============================================
-- 9. TABLES MANQUANTES
-- ============================================
SELECT 
  'MISSING_TABLES' as "Type",
  table_name as "Table Manquante",
  CASE table_name
    WHEN 'organizations' THEN 'CRITIQUE - Utilisée partout (admin.ts, super-admin.ts, actions)'
    WHEN 'org_memberships' THEN 'CRITIQUE - Utilisée partout (admin.ts, super-admin.ts, actions)'
    WHEN 'groups' THEN 'HAUTE - Utilisée dans admin.ts, actions'
    WHEN 'group_members' THEN 'HAUTE - Utilisée dans admin.ts, actions'
    WHEN 'content_assignments' THEN 'HAUTE - Utilisée dans actions.ts pour assigner du contenu'
    WHEN 'login_events' THEN 'MOYENNE - Utilisée dans super-admin.ts pour analytics'
    WHEN 'learning_sessions' THEN 'MOYENNE - Utilisée dans super-admin.ts pour analytics'
    WHEN 'course_progress' THEN 'HAUTE - Utilisée dans super-admin.ts pour analytics'
    WHEN 'path_progress' THEN 'HAUTE - Utilisée dans queries'
    WHEN 'resource_views' THEN 'MOYENNE - Utilisée dans queries'
    WHEN 'test_attempts' THEN 'MOYENNE - Utilisée dans queries'
    WHEN 'super_admins' THEN 'CRITIQUE - Utilisée dans auth/super-admin.ts'
    WHEN 'drive_documents' THEN 'MOYENNE - Utilisée dans formateur.ts'
    WHEN 'drive_folders' THEN 'MOYENNE - Utilisée dans formateur.ts'
    WHEN 'path_courses' THEN 'HAUTE - Utilisée dans queries'
    WHEN 'path_tests' THEN 'HAUTE - Utilisée dans queries'
    WHEN 'path_resources' THEN 'HAUTE - Utilisée dans queries'
    ELSE 'À vérifier'
  END as "Priorité",
  CASE table_name
    WHEN 'organizations' THEN 'CREATE TABLE organizations (id uuid PRIMARY KEY, name text, slug text, logo text, created_at timestamptz)'
    WHEN 'org_memberships' THEN 'CREATE TABLE org_memberships (id uuid PRIMARY KEY, org_id uuid, user_id uuid, role text, created_at timestamptz)'
    WHEN 'groups' THEN 'CREATE TABLE groups (id uuid PRIMARY KEY, org_id uuid, name text, created_at timestamptz)'
    WHEN 'group_members' THEN 'CREATE TABLE group_members (group_id uuid, user_id uuid, PRIMARY KEY (group_id, user_id))'
    WHEN 'content_assignments' THEN 'CREATE TABLE content_assignments (id uuid PRIMARY KEY, content_type text, content_id uuid, learner_id uuid, group_id uuid, assigned_at timestamptz)'
    WHEN 'login_events' THEN 'CREATE TABLE login_events (id uuid PRIMARY KEY, user_id uuid, created_at timestamptz)'
    WHEN 'learning_sessions' THEN 'CREATE TABLE learning_sessions (id uuid PRIMARY KEY, user_id uuid, course_id uuid, duration_minutes integer, created_at timestamptz)'
    WHEN 'course_progress' THEN 'CREATE TABLE course_progress (id uuid PRIMARY KEY, user_id uuid, course_id uuid, progress_percent integer, created_at timestamptz)'
    WHEN 'path_progress' THEN 'CREATE TABLE path_progress (id uuid PRIMARY KEY, user_id uuid, path_id uuid, progress_percent integer, created_at timestamptz)'
    WHEN 'resource_views' THEN 'CREATE TABLE resource_views (id uuid PRIMARY KEY, user_id uuid, resource_id uuid, created_at timestamptz)'
    WHEN 'test_attempts' THEN 'CREATE TABLE test_attempts (id uuid PRIMARY KEY, user_id uuid, test_id uuid, score integer, created_at timestamptz)'
    WHEN 'super_admins' THEN 'CREATE TABLE super_admins (id uuid PRIMARY KEY, user_id uuid, is_active boolean, created_at timestamptz)'
    WHEN 'drive_documents' THEN 'CREATE TABLE drive_documents (id uuid PRIMARY KEY, user_id uuid, folder_id uuid, name text, url text, created_at timestamptz)'
    WHEN 'drive_folders' THEN 'CREATE TABLE drive_folders (id uuid PRIMARY KEY, user_id uuid, parent_id uuid, name text, created_at timestamptz)'
    WHEN 'path_courses' THEN 'CREATE TABLE path_courses (path_id uuid, course_id uuid, "order" integer, PRIMARY KEY (path_id, course_id))'
    WHEN 'path_tests' THEN 'CREATE TABLE path_tests (path_id uuid, test_id uuid, "order" integer, PRIMARY KEY (path_id, test_id))'
    WHEN 'path_resources' THEN 'CREATE TABLE path_resources (path_id uuid, resource_id uuid, "order" integer, PRIMARY KEY (path_id, resource_id))'
    ELSE 'À définir'
  END as "SQL Suggestion"
FROM (
  VALUES 
    ('organizations'),
    ('org_memberships'),
    ('groups'),
    ('group_members'),
    ('content_assignments'),
    ('login_events'),
    ('learning_sessions'),
    ('course_progress'),
    ('path_progress'),
    ('resource_views'),
    ('test_attempts'),
    ('super_admins'),
    ('drive_documents'),
    ('drive_folders'),
    ('path_courses'),
    ('path_tests'),
    ('path_resources')
) AS expected_tables(table_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name = expected_tables.table_name
);

-- ============================================
-- 10. VÉRIFICATION DES CONTRAINTES UNIQUES (pour UPSERT)
-- ============================================
SELECT 
  'UPSERT_CONSTRAINTS' as "Type",
  table_name as "Table",
  constraint_name as "Contrainte",
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as "Colonnes"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
  AND tc.table_name IN ('enrollments', 'path_progress', 'content_assignments', 'group_members')
GROUP BY table_name, constraint_name
ORDER BY table_name;

-- ============================================
-- 11. RLS POLICIES MANQUANTES
-- ============================================
SELECT 
  'RLS_STATUS' as "Type",
  table_name as "Table",
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name AND schemaname = 'public') = 0
    THEN '❌ PAS DE POLICIES'
    ELSE '✓ ' || (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = t.table_name AND schemaname = 'public') || ' policy(ies)'
  END as "Statut"
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'profiles', 'courses', 'paths', 'resources', 'tests',
    'enrollments', 'organizations', 'org_memberships',
    'groups', 'group_members', 'path_progress',
    'resource_views', 'test_attempts', 'content_assignments'
  )
ORDER BY table_name;

-- ============================================
-- 12. INCOHÉRENCES DE NOMENCLATURE
-- ============================================
-- Vérifier les colonnes creator_id vs owner_id vs created_by
SELECT 
  'OWNERSHIP_COLUMNS' as "Type",
  table_name as "Table",
  STRING_AGG(column_name, ', ' ORDER BY column_name) as "Colonnes de Propriété",
  CASE 
    WHEN table_name = 'courses' AND STRING_AGG(column_name, ', ' ORDER BY column_name) LIKE '%creator_id%'
         AND STRING_AGG(column_name, ', ' ORDER BY column_name) LIKE '%owner_id%'
    THEN '⚠ Utilise creator_id ET owner_id (peut créer confusion)'
    WHEN table_name = 'courses' AND STRING_AGG(column_name, ', ' ORDER BY column_name) LIKE '%created_by%'
    THEN '⚠ Utilise created_by (nommage différent)'
    ELSE '✓ Cohérent'
  END as "Note"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('courses', 'paths', 'resources', 'tests')
  AND column_name IN ('creator_id', 'owner_id', 'created_by', 'author_id')
GROUP BY table_name
HAVING COUNT(*) > 0
ORDER BY table_name;

-- ============================================
-- 13. INDEXES MANQUANTS (pour performance)
-- ============================================
-- Indexes manquants pour profiles.email
SELECT 
  'MISSING_INDEXES' as "Type",
  'profiles' as "Table",
  'email' as "Colonne",
  'CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);' as "SQL"
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
)
AND NOT EXISTS (
  SELECT 1 FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'profiles' AND indexname LIKE '%email%'
);

-- Indexes manquants pour org_memberships
SELECT 
  'MISSING_INDEXES' as "Type",
  'org_memberships' as "Table",
  'user_id, org_id' as "Colonne",
  'CREATE INDEX IF NOT EXISTS org_memberships_user_org_idx ON org_memberships (user_id, org_id);' as "SQL"
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'org_memberships'
)
AND NOT EXISTS (
  SELECT 1 FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'org_memberships' AND indexname LIKE '%user_org%'
);

-- ============================================
-- 14. RÉSUMÉ FINAL
-- ============================================
SELECT 
  'SUMMARY' as "Type",
  'RÉSUMÉ DE L''AUDIT' as "Section",
  (
    SELECT COUNT(*)::text FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ) || ' tables au total' as "Info",
  (
    SELECT COUNT(*)::text FROM (
      SELECT 'organizations'::text AS table_name
      UNION ALL SELECT 'org_memberships'
      UNION ALL SELECT 'groups'
      UNION ALL SELECT 'group_members'
      UNION ALL SELECT 'content_assignments'
      UNION ALL SELECT 'login_events'
      UNION ALL SELECT 'learning_sessions'
      UNION ALL SELECT 'course_progress'
      UNION ALL SELECT 'path_progress'
      UNION ALL SELECT 'resource_views'
      UNION ALL SELECT 'test_attempts'
      UNION ALL SELECT 'super_admins'
      UNION ALL SELECT 'drive_documents'
      UNION ALL SELECT 'drive_folders'
      UNION ALL SELECT 'path_courses'
      UNION ALL SELECT 'path_tests'
      UNION ALL SELECT 'path_resources'
    ) AS expected_tables
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_name = expected_tables.table_name
    )
  ) || ' tables manquantes critiques' as "Alertes";

-- Message final
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'AUDIT TERMINÉ';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Vérifiez les résultats ci-dessus pour identifier les problèmes.';
  RAISE NOTICE 'Créez ensuite la migration de correction avec les éléments manquants.';
END $$;


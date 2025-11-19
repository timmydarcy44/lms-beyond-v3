-- ============================================
-- AUDIT COMPLET DE LA BASE DE DONNÉES
-- ============================================
-- Exécutez ce script dans Supabase Studio → SQL Editor
-- Copiez tous les résultats et donnez-les moi
-- Je créerai ensuite une migration adaptée à VOTRE structure
-- ============================================

-- ============================================
-- 1. LISTE DE TOUTES LES TABLES PUBLIQUES
-- ============================================
SELECT 
    'TABLES' as section,
    table_name,
    'table' as type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 2. COLONNES DE LA TABLE profiles
-- ============================================
SELECT 
    'PROFILES_COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 3. COLONNES DE LA TABLE courses
-- ============================================
SELECT 
    'COURSES_COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'courses'
ORDER BY ordinal_position;

-- ============================================
-- 4. COLONNES DE LA TABLE resources
-- ============================================
SELECT 
    'RESOURCES_COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'resources'
ORDER BY ordinal_position;

-- ============================================
-- 5. COLONNES DE LA TABLE paths
-- ============================================
SELECT 
    'PATHS_COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'paths'
ORDER BY ordinal_position;

-- ============================================
-- 6. COLONNES DE LA TABLE tests
-- ============================================
SELECT 
    'TESTS_COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tests'
ORDER BY ordinal_position;

-- ============================================
-- 7. COLONNES DE LA TABLE enrollments
-- ============================================
SELECT 
    'ENROLLMENTS_COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- ============================================
-- 8. TOUTES LES AUTRES TABLES (colonnes principales)
-- ============================================
SELECT 
    'OTHER_TABLES' as section,
    table_name,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT IN ('profiles', 'courses', 'resources', 'paths', 'tests', 'enrollments')
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 9. CONTRAINTES ET INDEX SUR resources (si existe)
-- ============================================
SELECT 
    'RESOURCES_CONSTRAINTS' as section,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'resources'
ORDER BY constraint_name;

-- ============================================
-- 10. VÉRIFICATION SPÉCIALE : colonne "type" vs "resource_type"
-- ============================================
SELECT 
    'RESOURCES_TYPE_CHECK' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
              AND table_name = 'resources' 
              AND column_name = 'type'
        ) THEN 'EXISTS: type'
        ELSE 'NOT EXISTS: type'
    END as type_column_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
              AND table_name = 'resources' 
              AND column_name = 'resource_type'
        ) THEN 'EXISTS: resource_type'
        ELSE 'NOT EXISTS: resource_type'
    END as resource_type_column_status;

-- ============================================
-- 11. LISTE DE TOUTES LES VUES
-- ============================================
SELECT 
    'VIEWS' as section,
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 12. ERREURS POTENTIELLES : Tables avec colonne "type"
-- ============================================
SELECT 
    'TABLES_WITH_TYPE_COLUMN' as section,
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'type'
ORDER BY table_name;






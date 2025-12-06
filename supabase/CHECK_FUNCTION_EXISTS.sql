-- Script de diagnostic pour vérifier si la fonction get_jessica_catalog_items existe
-- et quelle est sa définition actuelle

-- 1. Vérifier si la fonction existe
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_jessica_catalog_items';

-- 2. Vérifier les colonnes de catalog_items pour voir si slug existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'catalog_items'
ORDER BY ordinal_position;

-- 3. Vérifier les colonnes de resources, courses, tests pour voir si slug existe
SELECT 'resources' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'resources'
  AND column_name = 'slug'
UNION ALL
SELECT 'courses' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'courses'
  AND column_name = 'slug'
UNION ALL
SELECT 'tests' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tests'
  AND column_name = 'slug';


-- Script pour vérifier et comprendre la structure de sections et les triggers

-- 1. Vérifier la structure de la table sections
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sections'
ORDER BY ordinal_position;

-- 2. Vérifier les triggers sur courses qui pourraient créer des sections
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND (event_object_table = 'courses' OR event_object_table = 'sections');

-- 3. Vérifier les foreign keys et contraintes
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'sections' OR tc.table_name = 'courses');

-- 4. Vérifier les fonctions qui pourraient être liées
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition LIKE '%sections%' OR routine_definition LIKE '%courses%')
LIMIT 10;





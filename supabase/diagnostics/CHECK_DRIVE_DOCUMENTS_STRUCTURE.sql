-- Point SQL complet sur la table drive_documents
-- Vérifier la structure réelle de la table

-- 1. Liste de toutes les colonnes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drive_documents'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.drive_documents'::regclass;

-- 3. Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'drive_documents' 
  AND schemaname = 'public';

-- 4. Compter les documents
SELECT COUNT(*) as total_documents FROM public.drive_documents;

-- 5. Vérifier un document exemple avec toutes les colonnes
SELECT * FROM public.drive_documents LIMIT 1;

-- 6. Vérifier spécifiquement file_url
SELECT 
    COUNT(*) as total,
    COUNT(file_url) as has_file_url,
    COUNT(CASE WHEN file_url IS NOT NULL THEN 1 END) as file_url_not_null,
    COUNT(CASE WHEN file_url IS NULL OR file_url = '' THEN 1 END) as file_url_null_or_empty
FROM public.drive_documents;


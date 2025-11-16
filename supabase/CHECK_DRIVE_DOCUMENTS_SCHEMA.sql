-- Vérifier la structure réelle de la table drive_documents
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drive_documents'
ORDER BY ordinal_position;

-- Vérifier aussi s'il y a des documents existants
SELECT COUNT(*) as document_count FROM public.drive_documents;

-- Vérifier un document exemple si il y en a
SELECT * FROM public.drive_documents LIMIT 1;

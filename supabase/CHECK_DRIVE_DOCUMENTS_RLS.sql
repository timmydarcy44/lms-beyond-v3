-- Vérifier les RLS policies sur drive_documents
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'drive_documents'
ORDER BY policyname;

-- Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity as "RLS enabled"
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'drive_documents';

-- Vérifier les documents existants avec leur statut
SELECT 
    id,
    title,
    author_id,
    status,
    shared_with,
    submitted_at,
    updated_at,
    deposited_at
FROM public.drive_documents
ORDER BY updated_at DESC
LIMIT 10;

-- Vérifier si des documents partagés existent
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE status = 'shared') as shared_documents,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_documents,
    COUNT(*) FILTER (WHERE shared_with IS NOT NULL) as documents_with_shared_with
FROM public.drive_documents;


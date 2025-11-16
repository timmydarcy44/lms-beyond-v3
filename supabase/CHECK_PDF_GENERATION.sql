-- Script pour vérifier la génération et le stockage des PDFs

-- 1. Vérifier les documents partagés et leur file_url
SELECT 
    id,
    title,
    status,
    author_id,
    shared_with,
    file_url,
    submitted_at,
    updated_at,
    CASE 
        WHEN file_url IS NULL THEN '❌ Pas de PDF'
        WHEN file_url = '' THEN '❌ URL vide'
        ELSE '✅ PDF présent'
    END as pdf_status
FROM drive_documents
WHERE status = 'shared'
ORDER BY updated_at DESC
LIMIT 20;

-- 2. Compter les documents avec et sans PDF
SELECT 
    status,
    COUNT(*) as total,
    COUNT(file_url) FILTER (WHERE file_url IS NOT NULL AND file_url != '') as avec_pdf,
    COUNT(*) FILTER (WHERE file_url IS NULL OR file_url = '') as sans_pdf
FROM drive_documents
WHERE status = 'shared'
GROUP BY status;

-- 3. Vérifier les documents récents (dernières 24h)
SELECT 
    id,
    title,
    status,
    file_url,
    submitted_at,
    updated_at
FROM drive_documents
WHERE status = 'shared'
    AND updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- 4. Vérifier si le bucket "public" existe
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name = 'public';

-- 5. Vérifier les fichiers PDF dans le bucket "public"
-- Note: La structure exacte peut varier selon votre version de Supabase
SELECT 
    name,
    bucket_id,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'public'
    AND name LIKE 'drive-documents/%'
ORDER BY created_at DESC
LIMIT 20;


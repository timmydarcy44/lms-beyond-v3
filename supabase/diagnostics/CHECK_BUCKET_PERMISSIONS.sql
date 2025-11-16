-- Script pour vérifier les permissions du bucket "public"

-- 1. Vérifier que le bucket "public" existe
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name = 'public';

-- 2. Vérifier les fichiers dans le bucket "public"
SELECT 
    name,
    bucket_id,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'public'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Vérifier les fichiers PDF spécifiquement
SELECT 
    name,
    bucket_id,
    created_at,
    (metadata->>'size')::bigint as size_bytes,
    metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'public'
    AND name LIKE 'drive-documents/%'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Compter les fichiers PDF par dossier utilisateur
SELECT 
    split_part(name, '/', 2) as user_id,
    COUNT(*) as pdf_count,
    SUM((metadata->>'size')::bigint) as total_size_bytes
FROM storage.objects
WHERE bucket_id = 'public'
    AND name LIKE 'drive-documents/%'
GROUP BY split_part(name, '/', 2)
ORDER BY pdf_count DESC;



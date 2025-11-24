-- Script de vérification pour le bucket Jessica CONTENTIN
-- Exécutez ce script dans Supabase SQL Editor pour diagnostiquer les problèmes

-- 1. Vérifier si le bucket existe
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name = 'jessica-contentin' OR name ILIKE '%jessica%contentin%';

-- 2. Vérifier les policies RLS pour le bucket
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (qual::text ILIKE '%jessica-contentin%' OR policyname ILIKE '%jessica%contentin%');

-- 3. Vérifier les fichiers dans le bucket
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'jessica-contentin'
ORDER BY created_at DESC;

-- 4. Tester l'accès public (cette requête devrait retourner des résultats si le bucket est public)
SELECT 
    name,
    bucket_id
FROM storage.objects
WHERE bucket_id = 'jessica-contentin'
LIMIT 5;



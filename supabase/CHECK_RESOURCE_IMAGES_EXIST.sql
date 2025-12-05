-- Vérifier si les images existent dans les buckets Supabase Storage
-- =========================================

-- 1. Vérifier tous les buckets disponibles
SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets
ORDER BY name;

-- 2. Chercher les fichiers dans le bucket "Public"
SELECT 
    'Public bucket' as bucket,
    name as file_name,
    bucket_id,
    created_at
FROM storage.objects
WHERE bucket_id = 'Public'
  AND (name ILIKE '%sommeil%' 
       OR name ILIKE '%colere%' 
       OR name ILIKE '%colère%'
       OR name ILIKE '%confiance%')
ORDER BY name;

-- 3. Chercher les fichiers dans le bucket "Jessica CONTENTIN"
SELECT 
    'Jessica CONTENTIN bucket' as bucket,
    name as file_name,
    bucket_id,
    created_at
FROM storage.objects
WHERE bucket_id = 'Jessica CONTENTIN'
  AND (name ILIKE '%sommeil%' 
       OR name ILIKE '%colere%' 
       OR name ILIKE '%colère%'
       OR name ILIKE '%confiance%')
ORDER BY name;

-- 4. Chercher les fichiers dans tous les buckets (recherche globale)
SELECT 
    bucket_id,
    name as file_name,
    created_at
FROM storage.objects
WHERE name ILIKE '%Guide_Sommeil%'
   OR name ILIKE '%Guide_Gestion_Colere%'
   OR name ILIKE '%Confiance_en_soi_test%'
   OR name ILIKE '%sommeil%'
   OR name ILIKE '%colere%'
   OR name ILIKE '%confiance%'
ORDER BY bucket_id, name;


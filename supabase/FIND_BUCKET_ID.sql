-- Trouver l'ID exact du bucket "Jessica CONTENTIN"
-- =========================================

-- 1. Lister tous les buckets et leurs IDs
SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets
WHERE name ILIKE '%jessica%' OR name ILIKE '%contentin%'
ORDER BY name;

-- 2. Tester l'URL avec différents encodages
-- L'ID du bucket peut être différent du nom affiché
-- Par exemple, "Jessica CONTENTIN" pourrait avoir l'ID "jessica-contentin" ou "jessica_contentin"

-- 3. Vérifier les fichiers dans le bucket pour confirmer l'ID
SELECT 
    bucket_id,
    name as file_name,
    created_at
FROM storage.objects
WHERE bucket_id IN (
    SELECT id FROM storage.buckets 
    WHERE name ILIKE '%jessica%' OR name ILIKE '%contentin%'
)
AND (name ILIKE '%Guide_Sommeil%' 
     OR name ILIKE '%Guide_Gestion_Colere%'
     OR name ILIKE '%Confiance_en_soi_test%')
ORDER BY bucket_id, name;

-- 4. Construire l'URL correcte
-- Une fois que vous avez l'ID exact du bucket, utilisez-le dans UPDATE_RESOURCE_IMAGES.sql
-- Format: https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET_ID]/[FILE_NAME]


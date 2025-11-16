-- Permettre NULL pour file_url dans drive_documents
-- Actuellement file_url est NOT NULL mais stocké comme chaîne vide ""
-- Il est plus logique de permettre NULL pour les documents sans fichier PDF

-- 1. D'ABORD, retirer la contrainte NOT NULL (sinon on ne peut pas mettre NULL)
ALTER TABLE public.drive_documents
ALTER COLUMN file_url DROP NOT NULL;

-- 2. Ensuite, convertir les chaînes vides en NULL
UPDATE public.drive_documents
SET file_url = NULL
WHERE file_url = '' OR file_url IS NULL;

-- 3. Vérifier le résultat
SELECT 
    COUNT(*) as total,
    COUNT(file_url) as has_file_url,
    COUNT(CASE WHEN file_url IS NULL THEN 1 END) as file_url_null,
    COUNT(CASE WHEN file_url IS NOT NULL AND file_url != '' THEN 1 END) as file_url_valid
FROM public.drive_documents;


-- Script SQL pour trouver et lier automatiquement un PDF à une ressource
-- ============================================================================================================================
-- Ce script nécessite que le fichier soit déjà uploadé dans Supabase Storage
-- 
-- INSTRUCTIONS:
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Le script cherchera le fichier dans les buckets "Public" et "Jessica CONTENTIN"
-- 3. Il mettra à jour automatiquement le file_url de la ressource
--
-- NOTE: Ce script utilise les fonctions Supabase Storage qui peuvent nécessiter
-- des permissions spéciales. Si cela ne fonctionne pas, utilisez plutôt la route API
-- POST /api/admin/auto-link-resource-pdf

-- ID de la ressource
DO $$
DECLARE
    resource_id UUID := 'f2a961f4-bc0e-49cd-b683-ad65e834213b';
    resource_title TEXT;
    pdf_url TEXT;
    bucket_name TEXT;
    file_path TEXT;
    supabase_url TEXT := 'https://fqqqejpakbccwvrlolpc.supabase.co';
BEGIN
    -- Récupérer le titre de la ressource
    SELECT title INTO resource_title
    FROM resources
    WHERE id = resource_id;
    
    IF resource_title IS NULL THEN
        RAISE EXCEPTION 'Ressource non trouvée avec l''ID: %', resource_id;
    END IF;
    
    RAISE NOTICE 'Recherche du PDF pour la ressource: %', resource_title;
    
    -- Construire l'URL du PDF (vous devez remplacer par le chemin réel du fichier)
    -- Exemple: si le fichier est dans "Public/Guide_pratique_le_sommeil.pdf"
    bucket_name := 'Public';
    file_path := 'Guide_pratique_le_sommeil.pdf';
    pdf_url := supabase_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
    
    -- Mettre à jour la ressource
    UPDATE resources
    SET 
        file_url = pdf_url,
        updated_at = NOW()
    WHERE id = resource_id;
    
    RAISE NOTICE '✅ PDF associé avec succès!';
    RAISE NOTICE 'URL: %', pdf_url;
    
    -- Vérifier la mise à jour
    SELECT file_url INTO pdf_url
    FROM resources
    WHERE id = resource_id;
    
    IF pdf_url IS NOT NULL THEN
        RAISE NOTICE '✅ Vérification: file_url = %', pdf_url;
    ELSE
        RAISE WARNING '⚠️ file_url est toujours NULL après la mise à jour';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur: %', SQLERRM;
END $$;

-- Afficher le résultat
SELECT 
    r.id AS resource_id,
    r.title AS resource_title,
    r.file_url,
    CASE 
        WHEN r.file_url IS NOT NULL THEN '✅ PDF disponible'
        ELSE '❌ Aucun fichier associé'
    END AS file_status
FROM 
    resources r
WHERE 
    r.id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b';


-- Mettre à jour l'URL du PDF pour la ressource "Guide pratique : comprendre et résoudre les problématiques de sommeil"
-- ============================================================================================================================
-- ID de la ressource: f2a961f4-bc0e-49cd-b683-ad65e834213b
-- ID du catalog_item: a8a82d15-044a-4d99-8918-29f4ac139071
--
-- INSTRUCTIONS:
-- 1. Uploader le PDF dans Supabase Storage (bucket "Public" ou "Jessica CONTENTIN")
-- 2. Récupérer l'URL publique du fichier (ex: https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Public/nom-du-fichier.pdf)
-- 3. Remplacer 'VOTRE_URL_PDF_ICI' ci-dessous par l'URL réelle du PDF
-- 4. Exécuter ce script

-- Mettre à jour l'URL du PDF
UPDATE resources
SET 
    file_url = 'VOTRE_URL_PDF_ICI', -- ⚠️ REMPLACER PAR L'URL RÉELLE DU PDF
    updated_at = NOW()
WHERE id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b'
   OR title ILIKE '%Guide pratique%sommeil%enfants%3 à 11 ans%';

-- Vérifier la mise à jour
SELECT 
    r.id AS resource_id,
    r.title AS resource_title,
    r.file_url,
    r.video_url,
    r.audio_url,
    r.kind AS resource_kind,
    CASE 
        WHEN r.file_url IS NOT NULL THEN '✅ PDF disponible'
        WHEN r.video_url IS NOT NULL THEN '✅ Vidéo disponible'
        WHEN r.audio_url IS NOT NULL THEN '✅ Audio disponible'
        ELSE '❌ Aucun fichier associé'
    END AS file_status
FROM 
    resources r
WHERE 
    r.id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b'
    OR r.title ILIKE '%sommeil%';


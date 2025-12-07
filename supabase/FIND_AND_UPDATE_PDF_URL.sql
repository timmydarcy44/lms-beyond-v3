-- Trouver le fichier PDF "Guide_pratique_le_sommeil" dans Supabase Storage
-- et mettre à jour l'URL dans la table resources
-- ============================================================================================================================
-- ID de la ressource: f2a961f4-bc0e-49cd-b683-ad65e834213b

-- IMPORTANT: Ce script nécessite que vous ayez uploadé le fichier dans Supabase Storage
-- et que vous connaissiez le nom exact du fichier ou son chemin

-- Option 1: Si vous connaissez l'URL complète du fichier, utilisez UPDATE_RESOURCE_PDF_URL.sql
-- Option 2: Si vous connaissez seulement le nom du fichier, utilisez ce script

-- Construire l'URL du fichier (remplacez 'nom-du-fichier.pdf' par le nom réel)
-- Le format est généralement: https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET]/[PATH]

-- Exemple pour le bucket "Public":
-- https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Public/Guide_pratique_le_sommeil.pdf

-- Exemple pour le bucket "Jessica CONTENTIN":
-- https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_pratique_le_sommeil.pdf

-- Mettre à jour l'URL du PDF
-- ⚠️ REMPLACER 'VOTRE_URL_PDF_ICI' par l'URL réelle du fichier uploadé
UPDATE resources
SET 
    file_url = 'VOTRE_URL_PDF_ICI', -- ⚠️ REMPLACER PAR L'URL RÉELLE
    updated_at = NOW()
WHERE id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b';

-- Vérifier la mise à jour
SELECT 
    r.id AS resource_id,
    r.title AS resource_title,
    r.file_url,
    r.kind AS resource_kind,
    CASE 
        WHEN r.file_url IS NOT NULL THEN '✅ PDF disponible'
        ELSE '❌ Aucun fichier associé'
    END AS file_status
FROM 
    resources r
WHERE 
    r.id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b';


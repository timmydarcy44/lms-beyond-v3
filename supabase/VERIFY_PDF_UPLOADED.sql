-- Vérifier si le PDF a été uploadé et associé à la ressource
-- Guide pratique : comprendre et résoudre les problématiques de sommeil des enfants de 3 à 11 ans

SELECT 
    r.id AS resource_id,
    r.title AS resource_title,
    r.file_url,
    r.video_url,
    r.audio_url,
    r.kind AS resource_kind,
    r.description,
    ci.id AS catalog_item_id,
    ci.price,
    ci.is_active,
    CASE 
        WHEN r.file_url IS NOT NULL THEN '✅ PDF disponible'
        WHEN r.video_url IS NOT NULL THEN '✅ Vidéo disponible'
        WHEN r.audio_url IS NOT NULL THEN '✅ Audio disponible'
        ELSE '❌ Aucun fichier associé'
    END AS file_status,
    -- Extraire le nom du fichier de l'URL
    CASE 
        WHEN r.file_url IS NOT NULL THEN 
            SUBSTRING(r.file_url FROM '/([^/]+\.pdf)')
        ELSE NULL
    END AS file_name
FROM 
    resources r
LEFT JOIN 
    catalog_items ci ON r.id = ci.content_id AND ci.item_type = 'ressource'
WHERE 
    r.id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b' -- ID de la ressource "Guide pratique : comprendre et résoudre les problématiques de sommeil"
    OR r.title ILIKE '%sommeil%'
ORDER BY 
    r.created_at DESC;


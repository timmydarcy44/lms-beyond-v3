-- Vérifier si le file_url existe pour la ressource "Guide pratique : comprendre et résoudre les problématiques de sommeil"
-- ============================================================================================================================
-- ID de la ressource: f2a961f4-bc0e-49cd-b683-ad65e834213b
-- ID du catalog_item: a8a82d15-044a-4d99-8918-29f4ac139071

-- 1. Vérifier les données de la ressource
SELECT 
    r.id AS resource_id,
    r.title AS resource_title,
    r.file_url,
    r.video_url,
    r.audio_url,
    r.kind AS resource_kind,
    r.slug,
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
    OR r.title ILIKE '%sommeil%enfants%3 à 11 ans%';

-- 2. Vérifier le catalog_item associé
SELECT 
    ci.id AS catalog_item_id,
    ci.title AS catalog_item_title,
    ci.content_id,
    ci.item_type,
    ci.is_active,
    ci.price
FROM 
    catalog_items ci
WHERE 
    ci.id = 'a8a82d15-044a-4d99-8918-29f4ac139071'
    OR ci.content_id = 'f2a961f4-bc0e-49cd-b683-ad65e834213b';

-- 3. Chercher des PDFs dans Supabase Storage qui pourraient correspondre
-- Note: Cette requête nécessite d'être exécutée dans l'interface Supabase Storage
-- ou via l'API Storage, pas via SQL direct

-- 4. Vérifier les accès pour cette ressource
SELECT 
    ca.id AS access_id,
    ca.user_id,
    ca.catalog_item_id,
    ca.access_status,
    ca.granted_at,
    p.email AS user_email
FROM 
    catalog_access ca
    LEFT JOIN profiles p ON p.id = ca.user_id
WHERE 
    ca.catalog_item_id = 'a8a82d15-044a-4d99-8918-29f4ac139071'
ORDER BY 
    ca.granted_at DESC;


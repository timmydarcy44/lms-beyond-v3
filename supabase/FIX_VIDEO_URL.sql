-- Script pour corriger l'URL publique d'une vidéo
-- Remplacez YOUR_SUPABASE_PROJECT_ID par votre vrai ID de projet (ex: fqqqejpakbccwvrlolpc)

-- Option 1: Mettre à jour l'URL pour une vidéo spécifique
UPDATE gamification_videos
SET public_url = REPLACE(
  public_url,
  'your_supabase_project_id',
  'fqqqejpakbccwvrlolpc'  -- Remplacez par votre vrai project ID
)
WHERE storage_path = '20251028_1045_New Video_simple_compose_01k8n39nk2eh491qsg9y1xnchd.mp4';

-- Option 2: Reconstruire l'URL correctement pour toutes les vidéos
-- Remplacez fqqqejpakbccwvrlolpc par votre vrai project ID
UPDATE gamification_videos
SET public_url = CONCAT(
  'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/',
  storage_bucket,
  '/',
  REPLACE(storage_path, ' ', '%20')  -- Encoder les espaces
)
WHERE public_url LIKE '%your_supabase_project_id%'
   OR public_url IS NULL;

-- Vérifier le résultat
SELECT 
  id,
  title,
  storage_path,
  public_url,
  is_active
FROM gamification_videos
WHERE storage_path = '20251028_1045_New Video_simple_compose_01k8n39nk2eh491qsg9y1xnchd.mp4';


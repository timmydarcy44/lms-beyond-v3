-- Script pour synchroniser les vidéos du bucket Storage avec la table gamification_videos
-- À exécuter si des vidéos ont été uploadées directement dans Storage sans passer par l'API

-- 1. Vérifier d'abord si la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gamification_videos'
  ) THEN
    RAISE EXCEPTION 'La table gamification_videos n''existe pas. Veuillez d''abord exécuter CREATE_GAMIFICATION_VIDEOS_TABLE.sql';
  END IF;
END $$;

-- 2. Récupérer votre Project URL depuis Supabase Dashboard > Settings > API
-- Remplacez YOUR_SUPABASE_PROJECT_ID par votre ID de projet (ex: fqqqejpakbccwvrlolpc)

-- 3. Insérer manuellement la vidéo qui est dans le bucket
-- IMPORTANT: Remplacez YOUR_SUPABASE_PROJECT_ID par votre vrai ID de projet
INSERT INTO gamification_videos (
  title,
  description,
  video_type,
  storage_path,
  storage_bucket,
  public_url,
  scenario_context,
  is_active
)
VALUES (
  'Vidéo Joueur PSG - Media Training',
  'Vidéo du joueur pour la simulation de media training',
  'player', -- Type: journalist, player, background, other
  '20251028_1045_New Video_simple_compose_01k8n39nk2eh491qsg9y1xnchd.mp4', -- Nom du fichier dans Storage
  'gamification-videos', -- Nom du bucket
  'https://YOUR_SUPABASE_PROJECT_ID.supabase.co/storage/v1/object/public/gamification-videos/20251028_1045_New%20Video_simple_compose_01k8n39nk2eh491qsg9y1xnchd.mp4', -- URL publique (remplacez YOUR_SUPABASE_PROJECT_ID)
  'media-training-psg', -- Contexte du scénario
  true -- Active
)
ON CONFLICT DO NOTHING; -- Ne pas insérer si déjà présent

-- 4. Vérifier que la vidéo a été insérée
SELECT 
  id,
  title,
  video_type,
  scenario_context,
  public_url,
  is_active,
  created_at
FROM gamification_videos
WHERE storage_path = '20251028_1045_New Video_simple_compose_01k8n39nk2eh491qsg9y1xnchd.mp4';

-- 5. Vérifier toutes les vidéos actives
SELECT 
  id,
  title,
  video_type,
  scenario_context,
  storage_path,
  public_url,
  is_active
FROM gamification_videos
WHERE is_active = true
ORDER BY created_at DESC;


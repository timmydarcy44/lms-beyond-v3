-- Script pour insérer la vidéo "Question 1.mp4" dans la table gamification_videos
-- Remplacez YOUR_SUPABASE_PROJECT_ID par votre vrai ID de projet (ex: fqqqejpakbccwvrlolpc)

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

-- 2. Supprimer l'ancienne entrée si elle existe (pour éviter les doublons)
DELETE FROM gamification_videos 
WHERE storage_path LIKE '%Question 1%' 
   OR storage_path LIKE '%question 1%'
   OR title ILIKE '%question 1%';

-- 3. Insérer la vidéo "Question 1.mp4"
-- IMPORTANT: Remplacez YOUR_SUPABASE_PROJECT_ID par votre vrai ID de projet (visible dans Supabase Dashboard > Settings > API)
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
  'Question 1.mp4',
  'Vidéo de la question 1 pour la simulation de media training',
  'player', -- Type: journalist, player, background, other
  'Question 1.mp4', -- Nom du fichier dans Storage (ajustez si le chemin est différent)
  'gamification-videos', -- Nom du bucket
  'https://YOUR_SUPABASE_PROJECT_ID.supabase.co/storage/v1/object/public/gamification-videos/Question%201.mp4', -- URL publique (remplacez YOUR_SUPABASE_PROJECT_ID)
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
  storage_path,
  public_url,
  is_active,
  created_at
FROM gamification_videos
WHERE title ILIKE '%question 1%'
   OR storage_path ILIKE '%question 1%'
ORDER BY created_at DESC;

-- 5. Si vous avez besoin de mettre à jour l'URL d'une vidéo existante
-- Remplacez YOUR_SUPABASE_PROJECT_ID par votre vrai ID de projet
UPDATE gamification_videos
SET public_url = CONCAT(
  'https://YOUR_SUPABASE_PROJECT_ID.supabase.co/storage/v1/object/public/',
  storage_bucket,
  '/',
  REPLACE(storage_path, ' ', '%20')  -- Encoder les espaces
)
WHERE (title ILIKE '%question 1%' OR storage_path ILIKE '%question 1%')
  AND (public_url IS NULL OR public_url LIKE '%YOUR_SUPABASE_PROJECT_ID%');




-- Script de diagnostic pour vérifier les vidéos de gamification

-- 1. Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'gamification_videos'
) AS table_exists;

-- 2. Vérifier le nombre de vidéos
SELECT COUNT(*) as total_videos FROM gamification_videos;

-- 3. Lister toutes les vidéos avec leurs détails
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
ORDER BY created_at DESC;

-- 4. Vérifier les vidéos actives
SELECT 
  id,
  title,
  video_type,
  scenario_context,
  public_url,
  is_active
FROM gamification_videos
WHERE is_active = true
ORDER BY created_at DESC;

-- 5. Vérifier les vidéos avec scenario_context = 'media-training-psg'
SELECT 
  id,
  title,
  video_type,
  scenario_context,
  public_url
FROM gamification_videos
WHERE scenario_context = 'media-training-psg'
ORDER BY created_at DESC;




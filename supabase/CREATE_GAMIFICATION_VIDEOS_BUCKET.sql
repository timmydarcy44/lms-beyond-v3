-- Créer un bucket pour stocker les vidéos de gamification/media training
-- Ce bucket sera utilisé pour stocker les vidéos de simulation d'interview

-- Créer le bucket (à exécuter dans Supabase Dashboard > Storage ou via SQL)
-- Note: Les buckets doivent être créés via l'interface Supabase ou l'API Storage
-- Ce fichier contient les instructions et les policies RLS

-- Instructions pour créer le bucket:
-- 1. Aller dans Supabase Dashboard > Storage
-- 2. Créer un nouveau bucket nommé "gamification-videos"
-- 3. Le rendre public si les vidéos doivent être accessibles publiquement
--    OU le garder privé et utiliser des signed URLs

-- Policies RLS pour le bucket "gamification-videos"
-- (À exécuter après création du bucket)

-- Permettre aux super admins de tout faire
CREATE POLICY "Super admins can manage gamification videos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'gamification-videos' AND
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
    AND super_admins.is_active = true
  )
)
WITH CHECK (
  bucket_id = 'gamification-videos' AND
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
    AND super_admins.is_active = true
  )
);

-- Permettre la lecture publique des vidéos (si le bucket est public)
CREATE POLICY "Public can view gamification videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gamification-videos');

-- Commentaires
COMMENT ON POLICY "Super admins can manage gamification videos" ON storage.objects IS 
'Permet aux super admins de gérer (upload, delete, update) les vidéos de gamification';

COMMENT ON POLICY "Public can view gamification videos" ON storage.objects IS 
'Permet à tous de visualiser les vidéos de gamification (si bucket public)';








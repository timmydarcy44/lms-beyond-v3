-- Script pour créer le bucket Storage pour Jessica CONTENTIN
-- Ce bucket stockera les images du site vitrine (hero, CTA, etc.)

-- Instructions pour créer le bucket:
-- 1. Aller dans Supabase Dashboard > Storage
-- 2. Cliquer sur "New bucket"
-- 3. Configurer:
--    - Nom: jessica-contentin
--    - Public: Oui (pour accès public aux images)
--    - File size limit: 10485760 (10 MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Policies RLS pour le bucket "jessica-contentin"
-- (À exécuter après création du bucket)

-- Permettre la lecture publique des images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view jessica contentin images'
  ) THEN
    CREATE POLICY "Public can view jessica contentin images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'jessica-contentin');
  END IF;
END $$;

-- Permettre aux super admins d'uploader des images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Super admins can upload jessica contentin images'
  ) THEN
    CREATE POLICY "Super admins can upload jessica contentin images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'jessica-contentin' AND
      EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE super_admins.user_id = auth.uid()
        AND super_admins.is_active = true
      )
    );
  END IF;
END $$;

-- Permettre aux super admins de supprimer des images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Super admins can delete jessica contentin images'
  ) THEN
    CREATE POLICY "Super admins can delete jessica contentin images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'jessica-contentin' AND
      EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE super_admins.user_id = auth.uid()
        AND super_admins.is_active = true
      )
    );
  END IF;
END $$;

-- Commentaires
COMMENT ON POLICY "Public can view jessica contentin images" ON storage.objects IS 
'Permet à tous de visualiser les images du site vitrine Jessica CONTENTIN';

COMMENT ON POLICY "Super admins can upload jessica contentin images" ON storage.objects IS 
'Permet aux super admins d''uploader des images pour le site vitrine';

COMMENT ON POLICY "Super admins can delete jessica contentin images" ON storage.objects IS 
'Permet aux super admins de supprimer des images du site vitrine';


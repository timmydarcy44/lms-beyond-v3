-- Créer le bucket de stockage pour Beyond Note
-- À exécuter dans Supabase SQL Editor ou via Supabase CLI

-- Vérifier si le bucket existe déjà
DO $$
BEGIN
  -- Créer le bucket s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'beyond-note'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'beyond-note',
      'beyond-note',
      true, -- Public pour permettre l'accès aux fichiers
      52428800, -- 50 MB max par fichier
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    );
  END IF;
END $$;

-- Politique RLS pour permettre l'upload aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'beyond-note' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politique RLS pour permettre la lecture des fichiers publics
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
CREATE POLICY "Public can read files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'beyond-note');

-- Politique RLS pour permettre la suppression de ses propres fichiers
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'beyond-note' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );


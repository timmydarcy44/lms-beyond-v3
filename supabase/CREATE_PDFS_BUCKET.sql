-- Créer un bucket dédié pour les PDFs des ressources
-- ============================================================================================================================

-- 1. Créer le bucket "PDFs" (ou "Resources PDFs")
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  true, -- Public pour permettre le téléchargement direct
  52428800, -- 50 MB max par fichier
  ARRAY['application/pdf'] -- Seulement les PDFs
)
ON CONFLICT (id) DO NOTHING;

-- 2. Créer une politique pour permettre l'upload aux super admins (Jessica Contentin)
CREATE POLICY IF NOT EXISTS "Super admins can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdfs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'contentin.cabinet@gmail.com'
  )
);

-- 3. Créer une politique pour permettre la lecture publique des PDFs
CREATE POLICY IF NOT EXISTS "PDFs are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pdfs');

-- 4. Créer une politique pour permettre la mise à jour aux super admins
CREATE POLICY IF NOT EXISTS "Super admins can update PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdfs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'contentin.cabinet@gmail.com'
  )
);

-- 5. Créer une politique pour permettre la suppression aux super admins
CREATE POLICY IF NOT EXISTS "Super admins can delete PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdfs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'contentin.cabinet@gmail.com'
  )
);

-- Vérifier que le bucket a été créé
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'pdfs';


-- Bucket Supabase pour les covers formations EDGE Business

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-covers',
  'training-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lecture publique des covers
DROP POLICY IF EXISTS "Public read training covers" ON storage.objects;
CREATE POLICY "Public read training covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-covers');

-- Pas d'upload direct client : uploads via service role (API super admin)

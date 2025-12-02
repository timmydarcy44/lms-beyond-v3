-- Créer les buckets de stockage nécessaires pour Beyond Connect
-- =================================================================
-- Note: Les buckets "Public", "Avatar" et "Beyond Connect" doivent être créés manuellement dans Supabase Storage
-- Ce script configure uniquement les politiques RLS (Row Level Security)

-- Supprimer les politiques existantes si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Beyond Connect files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own CV" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CV" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own CV" ON storage.objects;

-- Politique RLS pour le bucket Avatar (lecture publique, écriture authentifiée)
-- Note: Le bucket doit s'appeler "Avatar" (avec majuscule) ou "avatars" (minuscule)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id IN ('Avatar', 'avatars', 'Public', 'public'));

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('Avatar', 'avatars', 'Public', 'public') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('Avatar', 'avatars', 'Public', 'public') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id IN ('Avatar', 'avatars', 'Public', 'public') AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique RLS pour le bucket Beyond Connect (lecture publique, écriture authentifiée)
-- Note: Le bucket doit s'appeler "Beyond Connect" (avec espaces) ou "beyond-connect" (avec tiret)
CREATE POLICY "Beyond Connect files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id IN ('Beyond Connect', 'beyond-connect', 'Public', 'public'));

CREATE POLICY "Users can upload their own CV"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('Beyond Connect', 'beyond-connect', 'Public', 'public') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own CV"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('Beyond Connect', 'beyond-connect', 'Public', 'public') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own CV"
ON storage.objects FOR DELETE
USING (bucket_id IN ('Beyond Connect', 'beyond-connect', 'Public', 'public') AND auth.uid()::text = (storage.foldername(name))[1]);


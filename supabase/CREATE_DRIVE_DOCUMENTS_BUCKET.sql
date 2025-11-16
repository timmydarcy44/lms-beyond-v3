-- Script pour créer le bucket "public" pour les PDFs du Drive (si nécessaire)
-- Note: Le bucket "public" devrait déjà exister dans Supabase, mais ce script vérifie et le crée si nécessaire

-- 1. Vérifier si le bucket "public" existe
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name = 'public';

-- 2. Si le bucket n'existe pas, le créer (à exécuter manuellement si nécessaire)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'public',
--     'public',
--     true,  -- Public bucket
--     52428800,  -- 50 MB limit
--     ARRAY['application/pdf', 'image/*', 'video/*']::text[]
-- );

-- 3. Vérifier les politiques RLS pour le bucket "public"
-- Note: Les politiques de storage peuvent être gérées différemment selon la version de Supabase
-- Vérifiez dans le dashboard Supabase > Storage > Policies
SELECT 
    id,
    name,
    bucket_id,
    definition
FROM storage.policies
WHERE bucket_id = 'public';

-- 4. Si nécessaire, créer une politique pour permettre l'upload de PDFs (à exécuter manuellement)
-- CREATE POLICY "Allow authenticated users to upload PDFs"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     bucket_id = 'public' 
--     AND (storage.foldername(name))[1] = 'drive-documents'
--     AND (storage.extension(name)) = 'pdf'
-- );

-- 5. Créer une politique pour permettre la lecture publique des PDFs (à exécuter manuellement)
-- CREATE POLICY "Allow public read access to PDFs"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (
--     bucket_id = 'public' 
--     AND (storage.foldername(name))[1] = 'drive-documents'
--     AND (storage.extension(name)) = 'pdf'
-- );


-- Script pour créer le bucket de stockage pour les PDFs du Drive
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Créer le bucket "drive-documents" (ou utiliser "public" si préféré)
-- Note: Si le bucket existe déjà, cette commande échouera silencieusement

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'drive-documents',
    'drive-documents',
    true,  -- Public bucket pour accès direct aux PDFs
    52428800,  -- 50 MB limit
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Supprimer les politiques existantes (si elles existent) puis les recréer
DROP POLICY IF EXISTS "Allow authenticated users to upload drive PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to drive PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their drive PDFs" ON storage.objects;

-- 3. Créer une politique pour permettre l'upload de PDFs par les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload drive PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'drive-documents' 
    AND (storage.extension(name)) = 'pdf'
);

-- 4. Créer une politique pour permettre la lecture publique des PDFs
CREATE POLICY "Allow public read access to drive PDFs"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'drive-documents' 
    AND (storage.extension(name)) = 'pdf'
);

-- 5. Créer une politique pour permettre la suppression par les utilisateurs authentifiés (pour nettoyage)
CREATE POLICY "Allow authenticated users to delete their drive PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'drive-documents' 
    AND (storage.extension(name)) = 'pdf'
);

-- Alternative: Si vous préférez utiliser le bucket "public" existant, décommentez ceci :
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'public',
--     'public',
--     true,
--     52428800,
--     ARRAY['application/pdf', 'image/*', 'video/*']::text[]
-- )
-- ON CONFLICT (id) DO NOTHING;


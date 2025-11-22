-- Script alternatif pour configurer les policies RLS du bucket Jessica CONTENTIN
-- Si vous obtenez une erreur de permissions, utilisez l'interface Supabase (voir instructions ci-dessous)

-- IMPORTANT: Les policies de storage doivent être créées via l'interface Supabase Dashboard
-- car elles nécessitent des permissions spéciales.

-- Instructions pour créer les policies via l'interface :
-- 1. Aller dans Supabase Dashboard > Storage
-- 2. Cliquer sur le bucket "jessica-contentin"
-- 3. Aller dans l'onglet "Policies"
-- 4. Cliquer sur "New Policy"
-- 5. Créer les policies suivantes :

-- Policy 1: Lecture publique
-- Name: "Public can view jessica contentin images"
-- Allowed operation: SELECT
-- Target roles: public
-- USING expression: bucket_id = 'jessica-contentin'

-- Policy 2: Upload pour super admins
-- Name: "Super admins can upload jessica contentin images"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression: 
--   bucket_id = 'jessica-contentin' AND
--   EXISTS (
--     SELECT 1 FROM public.super_admins
--     WHERE super_admins.user_id = auth.uid()
--     AND super_admins.is_active = true
--   )

-- Policy 3: Suppression pour super admins
-- Name: "Super admins can delete jessica contentin images"
-- Allowed operation: DELETE
-- Target roles: authenticated
-- USING expression:
--   bucket_id = 'jessica-contentin' AND
--   EXISTS (
--     SELECT 1 FROM public.super_admins
--     WHERE super_admins.user_id = auth.uid()
--     AND super_admins.is_active = true
--   )

-- Si vous avez les permissions nécessaires, vous pouvez essayer cette version simplifiée :

-- Vérifier si le bucket existe et est public
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name = 'jessica-contentin';

-- Si le bucket n'est pas public, vous devez le rendre public via l'interface :
-- Storage > jessica-contentin > Settings > Toggle "Public bucket" to ON


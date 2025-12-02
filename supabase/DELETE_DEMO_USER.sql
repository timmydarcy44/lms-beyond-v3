-- Script pour supprimer l'utilisateur demo95958@gmail.com et son profil associé
-- ATTENTION: Cette opération est irréversible

-- 1. Récupérer l'ID de l'utilisateur
DO $$
DECLARE
    user_id_to_delete UUID;
BEGIN
    -- Trouver l'ID de l'utilisateur par email
    SELECT id INTO user_id_to_delete
    FROM auth.users
    WHERE email = 'demo95958@gmail.com';

    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'Utilisateur demo95958@gmail.com non trouvé dans auth.users';
    ELSE
        RAISE NOTICE 'Utilisateur trouvé avec ID: %', user_id_to_delete;

        -- Supprimer les candidatures Beyond Connect
        DELETE FROM public.beyond_connect_applications
        WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Candidatures Beyond Connect supprimées';

        -- Supprimer les autres données liées si nécessaire
        -- (ajoutez d'autres tables si nécessaire)

        -- Supprimer le profil
        DELETE FROM public.profiles
        WHERE id = user_id_to_delete;
        RAISE NOTICE 'Profil supprimé';

        -- Supprimer l'utilisateur de auth.users
        -- Note: Cette opération doit être faite via l'API Supabase Admin
        -- car auth.users nécessite des privilèges spéciaux
        RAISE NOTICE 'Pour supprimer complètement l''utilisateur, utilisez l''API Supabase Admin:';
        RAISE NOTICE 'supabase.auth.admin.deleteUser(''%'')', user_id_to_delete;
    END IF;
END $$;

-- 2. Afficher les informations de l'utilisateur avant suppression
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'demo95958@gmail.com';


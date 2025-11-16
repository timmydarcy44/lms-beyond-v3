-- Fix la contrainte CHECK sur profiles.role pour inclure 'super_admin'
-- Ce script supprime l'ancienne contrainte et en crée une nouvelle avec tous les rôles

-- Vérifier la contrainte actuelle
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'c'
AND conname LIKE '%role%';

-- Supprimer toutes les anciennes contraintes liées au rôle
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
        AND contype = 'c'
        AND conname LIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Contrainte % supprimée', constraint_name;
    END LOOP;
END $$;

-- Créer une nouvelle contrainte qui inclut tous les rôles possibles
-- Note: On inclut 'student' et 'learner' pour compatibilité avec les anciennes migrations
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('learner', 'student', 'instructor', 'admin', 'tutor', 'super_admin'));

-- Vérifier que la contrainte a été créée
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'c'
AND conname = 'profiles_role_check';

-- Maintenant, mettre à jour le rôle de timdarcypro@gmail.com
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = '60c88469-3c53-417f-a81d-565a662ad2f5';

-- Vérifier que la mise à jour a réussi
SELECT 
    id,
    email,
    role,
    full_name
FROM public.profiles
WHERE id = '60c88469-3c53-417f-a81d-565a662ad2f5';

-- Vérifier tous les super_admins (il ne devrait y en avoir qu'un)
SELECT 
    id,
    email,
    role,
    full_name
FROM public.profiles
WHERE role = 'super_admin';


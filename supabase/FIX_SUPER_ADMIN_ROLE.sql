-- Fix le rôle de timdarcypro@gmail.com pour qu'il soit bien super_admin
-- User ID: 60c88469-3c53-417f-a81d-565a662ad2f5

-- Vérifier le rôle actuel
SELECT 
    id,
    email,
    role,
    full_name
FROM public.profiles
WHERE id = '60c88469-3c53-417f-a81d-565a662ad2f5';

-- Mettre à jour le rôle vers super_admin
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




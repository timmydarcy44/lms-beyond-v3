-- Mettre à jour le rôle de Timmy Darcy (timmydarcy44@gmail.com)
-- Le rôle "formateur" en frontend = "instructor" en base de données

UPDATE public.profiles
SET role = 'instructor'
WHERE email = 'timmydarcy44@gmail.com';

-- Vérification
SELECT id, email, COALESCE(display_name, full_name, 'N/A') as name, role
FROM public.profiles
WHERE email = 'timmydarcy44@gmail.com';


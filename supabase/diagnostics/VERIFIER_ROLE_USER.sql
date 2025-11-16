-- Vérifier le rôle de Timmy Darcy
SELECT 
  id,
  email,
  role,
  display_name,
  full_name
FROM public.profiles
WHERE email = 'timmydarcy44@gmail.com';

-- Vérifier tous les rôles dans profiles
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;





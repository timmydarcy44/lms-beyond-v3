-- Vérifier si timdarcypro@gmail.com est super admin
-- ======================================================

-- 1. Vérifier que l'utilisateur existe
SELECT 
  'User Check' as "Info",
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE email = 'timdarcypro@gmail.com';

-- 2. Vérifier dans super_admins
SELECT 
  'Super Admin Check' as "Info",
  sa.user_id,
  sa.is_active,
  sa.created_at,
  sa.notes,
  p.email,
  p.full_name
FROM public.super_admins sa
JOIN public.profiles p ON p.id = sa.user_id
WHERE p.email = 'timdarcypro@gmail.com';

-- 3. Si aucun résultat dans super_admins, exécuter ceci :
-- INSERT INTO public.super_admins (user_id, created_by, notes)
-- SELECT id, id, 'Super Admin ajouté manuellement'
-- FROM public.profiles 
-- WHERE email = 'timdarcypro@gmail.com';




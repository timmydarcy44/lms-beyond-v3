-- Ajouter timdarcypro@gmail.com comme Super Admin avec rôle
-- ==========================================================

-- 1. Vérifier que l'utilisateur existe dans profiles
SELECT 
  'Vérification utilisateur' as "Info",
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE email = 'timdarcypro@gmail.com';

-- 2. Mettre à jour le rôle si nécessaire
-- Note: Le rôle dans profiles.role peut être "admin", "instructor", etc.
-- Ce qui compte pour Super Admin est la table super_admins, pas profiles.role
-- On met "admin" ici juste pour avoir un rôle valide dans profiles
UPDATE public.profiles
SET role = COALESCE(role, 'admin')
WHERE email = 'timdarcypro@gmail.com'
  AND (role IS NULL OR role = '');

-- 3. Ajouter comme Super Admin
INSERT INTO public.super_admins (user_id, created_by, notes)
SELECT 
  id,
  id,
  'Super Admin ajouté manuellement'
FROM public.profiles 
WHERE email = 'timdarcypro@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET
  is_active = TRUE,
  notes = 'Super Admin ajouté manuellement - réactivé';

-- 4. Vérifier que tout est correct
SELECT 
  'Super Admin créé avec succès !' as "Info",
  sa.user_id,
  p.email,
  p.full_name,
  p.role as "role_profile",
  sa.is_active,
  sa.created_at
FROM public.super_admins sa
JOIN public.profiles p ON p.id = sa.user_id
WHERE p.email = 'timdarcypro@gmail.com';


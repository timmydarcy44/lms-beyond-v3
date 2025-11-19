-- ============================================
-- Script pour créer/vérifier le compte contentin.cabinet@gmail.com
-- ============================================

-- Vérifier si le compte existe déjà
SELECT id, email, role, full_name, created_at
FROM public.profiles
WHERE email = 'contentin.cabinet@gmail.com';

-- Si le compte n'existe pas, vous devez :
-- 1. Créer le compte via l'interface Supabase Auth (Dashboard > Authentication > Users > Add User)
-- 2. Ou utiliser l'API Supabase Auth pour créer l'utilisateur
-- 3. Ensuite exécuter ce script pour mettre à jour le profil

-- Mettre à jour le rôle si le compte existe mais n'a pas le bon rôle
DO $$
DECLARE
  user_id uuid;
  user_email text := 'contentin.cabinet@gmail.com';
BEGIN
  -- Chercher l'utilisateur dans auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NOT NULL THEN
    -- Vérifier si le profil existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
      -- Créer le profil s'il n'existe pas
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (user_id, user_email, 'Jessica Contentin', 'super_admin')
      ON CONFLICT (id) DO NOTHING;
      
      RAISE NOTICE 'Profil créé pour % avec le rôle super_admin', user_email;
    ELSE
      -- Mettre à jour le rôle si nécessaire
      UPDATE public.profiles
      SET role = 'super_admin',
          full_name = COALESCE(full_name, 'Jessica Contentin')
      WHERE id = user_id AND (role IS DISTINCT FROM 'super_admin' OR full_name IS NULL);
      
      RAISE NOTICE 'Profil mis à jour pour %', user_email;
    END IF;
  ELSE
    RAISE NOTICE 'Utilisateur % non trouvé dans auth.users. Veuillez créer le compte via Supabase Auth d''abord.', user_email;
  END IF;
END $$;

-- Vérification finale
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'contentin.cabinet@gmail.com';


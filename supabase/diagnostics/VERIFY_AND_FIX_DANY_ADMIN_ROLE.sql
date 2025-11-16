-- Script pour vérifier et corriger le rôle admin de Dany Pain

-- 1. Vérifier l'état actuel
SELECT 
  'État actuel de Dany Pain' as info,
  p.id,
  p.email,
  p.full_name,
  p.role as profile_role,
  om.role as membership_role,
  om.org_id,
  o.name as org_name
FROM profiles p
LEFT JOIN org_memberships om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.org_id
WHERE p.email = 'paindany36@gmail.com' OR p.id IN (
  SELECT id FROM auth.users WHERE email = 'paindany36@gmail.com'
);

-- 2. Corriger le rôle dans profiles si nécessaire
DO $$
DECLARE
  user_id_var UUID;
  org_id_var UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'paindany36@gmail.com'
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'Utilisateur paindany36@gmail.com non trouvé dans auth.users';
  END IF;

  -- Récupérer l'ID de l'organisation Paris Saint Germain
  SELECT id INTO org_id_var
  FROM organizations
  WHERE name = 'Paris Saint Germain'
  LIMIT 1;

  IF org_id_var IS NULL THEN
    RAISE EXCEPTION 'Organisation Paris Saint Germain non trouvée';
  END IF;

  -- Mettre à jour ou créer le profil avec le rôle admin
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (user_id_var, 'paindany36@gmail.com', 'Dany Pain', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'admin',
    full_name = 'Dany Pain',
    email = COALESCE(profiles.email, 'paindany36@gmail.com');

  RAISE NOTICE 'Profil mis à jour avec rôle admin';

  -- Mettre à jour ou créer le membership avec le rôle admin
  INSERT INTO org_memberships (org_id, user_id, role)
  VALUES (org_id_var, user_id_var, 'admin')
  ON CONFLICT (org_id, user_id) DO UPDATE
  SET role = 'admin';

  RAISE NOTICE 'Membership mis à jour avec rôle admin';
END $$;

-- 3. Vérification finale
SELECT 
  'Vérification finale' as info,
  p.id,
  p.email,
  p.full_name,
  p.role as profile_role,
  om.role as membership_role,
  om.org_id,
  o.name as org_name,
  CASE 
    WHEN p.role = 'admin' AND om.role = 'admin' THEN '✓ Rôle admin correct'
    ELSE '✗ Rôle admin incorrect'
  END as status
FROM profiles p
LEFT JOIN org_memberships om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.org_id
WHERE p.email = 'paindany36@gmail.com' OR p.id IN (
  SELECT id FROM auth.users WHERE email = 'paindany36@gmail.com'
);





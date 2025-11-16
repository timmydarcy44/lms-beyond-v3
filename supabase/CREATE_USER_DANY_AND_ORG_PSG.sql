-- Script pour créer l'utilisateur Dany Pain et l'organisation Paris Saint Germain
-- Note: L'utilisateur doit être créé via Supabase Auth (interface ou API) avant d'exécuter ce script

-- 1. Créer l'organisation Paris Saint Germain
-- Note: On n'inclut que les colonnes qui existent réellement
-- Vérifier d'abord si l'organisation existe déjà
DO $$
DECLARE
  org_exists BOOLEAN;
  org_slug TEXT;
BEGIN
  -- Générer un slug à partir du nom (minuscules, espaces remplacés par des tirets)
  org_slug := LOWER(REPLACE('Paris Saint Germain', ' ', '-'));
  
  SELECT EXISTS(SELECT 1 FROM organizations WHERE name = 'Paris Saint Germain' OR slug = org_slug) INTO org_exists;
  
  IF NOT org_exists THEN
    INSERT INTO organizations (name, slug, description)
    VALUES (
      'Paris Saint Germain',
      org_slug,
      'Organisation pour Paris Saint Germain'
    );
    RAISE NOTICE 'Organisation "Paris Saint Germain" créée avec succès (slug: %)', org_slug;
  ELSE
    RAISE NOTICE 'Organisation "Paris Saint Germain" existe déjà';
  END IF;
END $$;

-- 2. Récupérer l'ID de l'organisation créée
DO $$
DECLARE
  org_id_var UUID;
  user_id_var UUID;
BEGIN
  -- Récupérer l'ID de l'organisation
  SELECT id INTO org_id_var
  FROM organizations
  WHERE name = 'Paris Saint Germain'
  LIMIT 1;

  IF org_id_var IS NULL THEN
    RAISE EXCEPTION 'Organisation "Paris Saint Germain" non trouvée';
  END IF;

  -- Récupérer l'ID de l'utilisateur (doit exister dans auth.users)
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'paindany36@gmail.com'
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RAISE NOTICE 'ATTENTION: L''utilisateur paindany36@gmail.com n''existe pas encore dans auth.users.';
    RAISE NOTICE 'Veuillez créer l''utilisateur via l''interface Supabase Auth ou l''API avant de continuer.';
    RAISE NOTICE 'Organisation créée avec l''ID: %', org_id_var;
  ELSE
    -- Créer ou mettre à jour le profil
    -- Vérifier d'abord si le profil existe
    IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id_var) THEN
      UPDATE profiles
      SET 
        full_name = 'Dany Pain',
        role = 'admin'
      WHERE id = user_id_var;
      RAISE NOTICE 'Profil mis à jour pour Dany Pain';
    ELSE
      INSERT INTO profiles (id, full_name, role)
      VALUES (
        user_id_var,
        'Dany Pain',
        'admin'
      );
      RAISE NOTICE 'Profil créé pour Dany Pain';
    END IF;

    -- Créer le membership admin
    -- Vérifier d'abord si le membership existe
    IF EXISTS (SELECT 1 FROM org_memberships WHERE org_id = org_id_var AND user_id = user_id_var) THEN
      UPDATE org_memberships
      SET role = 'admin'
      WHERE org_id = org_id_var AND user_id = user_id_var;
      RAISE NOTICE 'Membership admin mis à jour';
    ELSE
      INSERT INTO org_memberships (org_id, user_id, role)
      VALUES (
        org_id_var,
        user_id_var,
        'admin'
      );
      RAISE NOTICE 'Membership admin créé';
    END IF;

    RAISE NOTICE 'Utilisateur Dany Pain créé/mis à jour avec succès!';
    RAISE NOTICE 'Organisation Paris Saint Germain créée avec l''ID: %', org_id_var;
    RAISE NOTICE 'Membership admin créé pour paindany36@gmail.com';
  END IF;
END $$;

-- 3. Vérification finale
SELECT 
  o.name as organisation,
  o.id as org_id,
  p.full_name,
  au.email,
  p.role as profile_role,
  om.role as membership_role
FROM organizations o
LEFT JOIN org_memberships om ON om.org_id = o.id
LEFT JOIN profiles p ON p.id = om.user_id
LEFT JOIN auth.users au ON au.id = p.id
WHERE o.name = 'Paris Saint Germain';


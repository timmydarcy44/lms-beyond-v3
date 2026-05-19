-- Alignement des libellés historiques sur le token attendu par l’app (`ecole`, sans accent).
-- La contrainte CHECK sur `profiles.role` n’accepte que des valeurs ASCII listées ;
-- les variantes françaises traînent souvent dans `role_type` (texte libre).

UPDATE public.profiles
SET role_type = 'ecole'
WHERE role_type IS NOT NULL
  AND btrim(role_type) <> ''
  AND translate(
        lower(btrim(role_type)),
        'éèêëàáâãäùúûüôóòöîïíìçñ',
        'eeeeaaaaaauuuuooooiiiicn'
      ) = 'ecole';

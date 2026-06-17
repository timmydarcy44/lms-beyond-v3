-- Audit inscription EDGE /particuliers — à exécuter dans Supabase SQL Editor
-- Projet : zmcefidiiqqppowymoqb

-- 1) Colonnes profiles requises
SELECT
  col AS colonne_requise,
  EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'profiles'
      AND c.column_name = col
  ) AS presente
FROM (
  VALUES
    ('id'),
    ('email'),
    ('first_name'),
    ('last_name'),
    ('full_name'),
    ('role'),
    ('role_type'),
    ('type_profil'),
    ('access_connect'),
    ('access_lms'),
    ('access_care'),
    ('access_pro'),
    ('avatar_url')
) AS required(col)
ORDER BY colonne_requise;

-- 2) Contrainte role (PARTICULIER doit être autorisé)
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c'
  AND conname LIKE '%role%';

-- 3) Table slug public
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profile_settings'
ORDER BY ordinal_position;

-- 4) Appliquer le correctif si des colonnes manquent :
--    voir supabase/migrations/20260617100000_profiles_particuliers_edge_columns.sql

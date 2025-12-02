-- Ajouter les colonnes manquantes pour Beyond Connect dans la table profiles
-- ============================================================================

-- Ville de résidence
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN city TEXT;
    RAISE NOTICE 'Colonne city ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne city existe déjà';
  END IF;
END $$;

-- URL du CV
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cv_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cv_url TEXT;
    RAISE NOTICE 'Colonne cv_url ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne cv_url existe déjà';
  END IF;
END $$;

-- Nom du fichier CV
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cv_file_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cv_file_name TEXT;
    RAISE NOTICE 'Colonne cv_file_name ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne cv_file_name existe déjà';
  END IF;
END $$;

-- Date d'upload du CV
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cv_uploaded_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cv_uploaded_at TIMESTAMPTZ;
    RAISE NOTICE 'Colonne cv_uploaded_at ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne cv_uploaded_at existe déjà';
  END IF;
END $$;

-- Type d'emploi recherché (CDD, CDI, Freelance, Alternance, Stage, etc.)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN employment_type TEXT;
    RAISE NOTICE 'Colonne employment_type ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne employment_type existe déjà';
  END IF;
END $$;

-- Bio / Présentation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    RAISE NOTICE 'Colonne bio ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne bio existe déjà';
  END IF;
END $$;

-- Passions et centres d'intérêt
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'passions'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN passions TEXT;
    RAISE NOTICE 'Colonne passions ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne passions existe déjà';
  END IF;
END $$;

-- Études actuelles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'current_studies'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN current_studies TEXT;
    RAISE NOTICE 'Colonne current_studies ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne current_studies existe déjà';
  END IF;
END $$;

-- Niveau d'études
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'education_level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN education_level TEXT;
    RAISE NOTICE 'Colonne education_level ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne education_level existe déjà';
  END IF;
END $$;

-- Vérification finale
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('city', 'cv_url', 'cv_file_name', 'cv_uploaded_at', 'employment_type', 'bio', 'passions', 'current_studies', 'education_level')
ORDER BY column_name;


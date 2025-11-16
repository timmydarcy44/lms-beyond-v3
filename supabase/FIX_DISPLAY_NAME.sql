-- Ajouter la colonne display_name si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name text;
    
    -- Remplir depuis full_name si elle existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
      UPDATE public.profiles
      SET display_name = full_name
      WHERE display_name IS NULL AND full_name IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Vérification
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('display_name', 'full_name', 'email', 'role')
ORDER BY column_name;




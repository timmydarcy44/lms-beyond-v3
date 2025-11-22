-- Ajouter la colonne 'duration' à la table 'tests' si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'duration'
    ) THEN
        ALTER TABLE public.tests 
        ADD COLUMN duration TEXT;
        
        RAISE NOTICE 'Colonne "duration" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "duration" existe déjà dans la table "tests".';
    END IF;
END $$;









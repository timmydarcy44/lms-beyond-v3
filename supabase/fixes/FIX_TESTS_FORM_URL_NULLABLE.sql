-- Rendre la colonne 'form_url' nullable dans la table 'tests' si elle existe
DO $$
BEGIN
    -- Vérifier si la colonne existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'form_url'
    ) THEN
        -- Vérifier si la colonne est NOT NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tests' 
            AND column_name = 'form_url'
            AND is_nullable = 'NO'
        ) THEN
            -- Rendre la colonne nullable
            ALTER TABLE public.tests 
            ALTER COLUMN form_url DROP NOT NULL;
            
            RAISE NOTICE 'Colonne "form_url" rendue nullable dans la table "tests".';
        ELSE
            RAISE NOTICE 'Colonne "form_url" est déjà nullable dans la table "tests".';
        END IF;
    ELSE
        RAISE NOTICE 'Colonne "form_url" n''existe pas dans la table "tests".';
    END IF;
END $$;


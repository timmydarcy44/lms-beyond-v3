-- Ajouter la colonne 'description' à la table 'organizations' si elle n'existe pas déjà
DO $$
BEGIN
    -- Vérifier si la colonne 'description' existe déjà
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'description'
    ) THEN
        -- Ajouter la colonne 'description'
        ALTER TABLE public.organizations 
        ADD COLUMN description text;
        
        RAISE NOTICE 'Colonne "description" ajoutée à la table "organizations".';
    ELSE
        RAISE NOTICE 'Colonne "description" existe déjà dans la table "organizations".';
    END IF;
END $$;










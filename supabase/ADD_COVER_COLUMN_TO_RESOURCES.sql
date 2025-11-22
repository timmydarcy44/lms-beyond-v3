-- Ajouter la colonne 'thumbnail_url' ou 'cover_url' à la table 'resources' si elle n'existe pas déjà
DO $$
BEGIN
    -- Vérifier si la colonne 'thumbnail_url' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE public.resources 
        ADD COLUMN thumbnail_url text;
        
        RAISE NOTICE '✓ Colonne "thumbnail_url" ajoutée à la table "resources".';
    ELSE
        RAISE NOTICE '✓ Colonne "thumbnail_url" existe déjà dans la table "resources".';
    END IF;

    -- Vérifier si la colonne 'cover_url' existe (alternative)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'cover_url'
    ) THEN
        ALTER TABLE public.resources 
        ADD COLUMN cover_url text;
        
        RAISE NOTICE '✓ Colonne "cover_url" ajoutée à la table "resources".';
    ELSE
        RAISE NOTICE '✓ Colonne "cover_url" existe déjà dans la table "resources".';
    END IF;
END $$;









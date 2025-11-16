-- Ajouter la colonne 'category' à la table 'tests' si elle n'existe pas déjà
DO $$
BEGIN
    -- Vérifier si la colonne existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'category'
    ) THEN
        -- Ajouter la colonne
        ALTER TABLE public.tests ADD COLUMN category TEXT;
        
        RAISE NOTICE 'Colonne "category" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "category" existe déjà dans la table "tests".';
    END IF;

    -- Ajouter aussi cover_image si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN cover_image TEXT;
        
        RAISE NOTICE 'Colonne "cover_image" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "cover_image" existe déjà dans la table "tests".';
    END IF;

    -- Ajouter aussi hero_image_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'hero_image_url'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN hero_image_url TEXT;
        
        RAISE NOTICE 'Colonne "hero_image_url" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "hero_image_url" existe déjà dans la table "tests".';
    END IF;

    -- Ajouter aussi thumbnail_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN thumbnail_url TEXT;
        
        RAISE NOTICE 'Colonne "thumbnail_url" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "thumbnail_url" existe déjà dans la table "tests".';
    END IF;

    -- Ajouter aussi evaluation_type si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'evaluation_type'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN evaluation_type TEXT;
        
        RAISE NOTICE 'Colonne "evaluation_type" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "evaluation_type" existe déjà dans la table "tests".';
    END IF;

    -- Ajouter aussi skills si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'skills'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN skills TEXT;
        
        RAISE NOTICE 'Colonne "skills" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "skills" existe déjà dans la table "tests".';
    END IF;

    -- Ajouter aussi questions (JSONB) si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'questions'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN questions JSONB;
        
        RAISE NOTICE 'Colonne "questions" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "questions" existe déjà dans la table "tests".';
    END IF;
END $$;


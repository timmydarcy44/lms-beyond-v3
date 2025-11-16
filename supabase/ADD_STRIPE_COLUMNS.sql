-- Ajouter les colonnes Stripe aux tables de contenu

DO $$
BEGIN
    -- Ajouter stripe_product_id et stripe_price_id à la table resources
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resources' AND column_name = 'stripe_product_id'
    ) THEN
        ALTER TABLE public.resources ADD COLUMN stripe_product_id TEXT;
        RAISE NOTICE 'Colonne "stripe_product_id" ajoutée à la table "resources".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_product_id" existe déjà dans la table "resources".';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resources' AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE public.resources ADD COLUMN stripe_price_id TEXT;
        RAISE NOTICE 'Colonne "stripe_price_id" ajoutée à la table "resources".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_price_id" existe déjà dans la table "resources".';
    END IF;

    -- Ajouter stripe_product_id et stripe_price_id à la table tests
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'stripe_product_id'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN stripe_product_id TEXT;
        RAISE NOTICE 'Colonne "stripe_product_id" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_product_id" existe déjà dans la table "tests".';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE public.tests ADD COLUMN stripe_price_id TEXT;
        RAISE NOTICE 'Colonne "stripe_price_id" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_price_id" existe déjà dans la table "tests".';
    END IF;

    -- Ajouter stripe_product_id et stripe_price_id à la table courses
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'stripe_product_id'
    ) THEN
        ALTER TABLE public.courses ADD COLUMN stripe_product_id TEXT;
        RAISE NOTICE 'Colonne "stripe_product_id" ajoutée à la table "courses".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_product_id" existe déjà dans la table "courses".';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE public.courses ADD COLUMN stripe_price_id TEXT;
        RAISE NOTICE 'Colonne "stripe_price_id" ajoutée à la table "courses".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_price_id" existe déjà dans la table "courses".';
    END IF;

    -- Ajouter stripe_product_id et stripe_price_id à la table paths
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'paths' AND column_name = 'stripe_product_id'
    ) THEN
        ALTER TABLE public.paths ADD COLUMN stripe_product_id TEXT;
        RAISE NOTICE 'Colonne "stripe_product_id" ajoutée à la table "paths".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_product_id" existe déjà dans la table "paths".';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'paths' AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE public.paths ADD COLUMN stripe_price_id TEXT;
        RAISE NOTICE 'Colonne "stripe_price_id" ajoutée à la table "paths".';
    ELSE
        RAISE NOTICE 'Colonne "stripe_price_id" existe déjà dans la table "paths".';
    END IF;
END $$;




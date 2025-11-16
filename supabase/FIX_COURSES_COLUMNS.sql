-- ============================================
-- SCRIPT DE CORRECTION DES COLONNES MANQUANTES
-- Ajoute les colonnes manquantes dans courses si nécessaire
-- ============================================

-- Vérifier et ajouter published si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'published'
    ) THEN
        ALTER TABLE courses ADD COLUMN published BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne published ajoutée à courses';
        
        -- Mettre à jour published basé sur status
        UPDATE courses 
        SET published = (status = 'published' OR status = 'active')
        WHERE published IS NULL OR published = false;
        
        RAISE NOTICE '✅ Valeurs de published mises à jour depuis status';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne published existe déjà dans courses';
    END IF;
END $$;

-- Vérifier et ajouter hero_image_url si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'hero_image_url'
    ) THEN
        ALTER TABLE courses ADD COLUMN hero_image_url TEXT;
        RAISE NOTICE '✅ Colonne hero_image_url ajoutée à courses';
        
        -- Copier cover_image vers hero_image_url si cover_image existe
        UPDATE courses 
        SET hero_image_url = cover_image
        WHERE cover_image IS NOT NULL AND hero_image_url IS NULL;
        
        RAISE NOTICE '✅ Valeurs de hero_image_url copiées depuis cover_image';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne hero_image_url existe déjà dans courses';
    END IF;
END $$;

-- Vérifier et ajouter thumbnail_url si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
        RAISE NOTICE '✅ Colonne thumbnail_url ajoutée à courses';
        
        -- Copier cover_image vers thumbnail_url si cover_image existe
        UPDATE courses 
        SET thumbnail_url = cover_image
        WHERE cover_image IS NOT NULL AND thumbnail_url IS NULL;
        
        RAISE NOTICE '✅ Valeurs de thumbnail_url copiées depuis cover_image';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne thumbnail_url existe déjà dans courses';
    END IF;
END $$;

-- Vérifier et ajouter price si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'price'
    ) THEN
        ALTER TABLE courses ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE '✅ Colonne price ajoutée à courses';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne price existe déjà dans courses';
    END IF;
END $$;

-- Résumé final
DO $$
DECLARE
    has_published BOOLEAN;
    has_hero_image BOOLEAN;
    has_thumbnail BOOLEAN;
    has_price BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ DES COLONNES courses';
    RAISE NOTICE '========================================';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'published'
    ) INTO has_published;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'hero_image_url'
    ) INTO has_hero_image;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'thumbnail_url'
    ) INTO has_thumbnail;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'price'
    ) INTO has_price;
    
    IF has_published THEN
        RAISE NOTICE '✅ published: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ published: MANQUANTE';
    END IF;
    
    IF has_hero_image THEN
        RAISE NOTICE '✅ hero_image_url: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ hero_image_url: MANQUANTE';
    END IF;
    
    IF has_thumbnail THEN
        RAISE NOTICE '✅ thumbnail_url: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ thumbnail_url: MANQUANTE';
    END IF;
    
    IF has_price THEN
        RAISE NOTICE '✅ price: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ price: MANQUANTE';
    END IF;
    
    RAISE NOTICE '';
END $$;




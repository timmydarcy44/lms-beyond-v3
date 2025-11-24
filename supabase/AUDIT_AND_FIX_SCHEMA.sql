-- ============================================
-- SCRIPT COMPLET : AUDIT + CORRECTION AUTOMATIQUE
-- Exécute l'audit puis applique les corrections nécessaires
-- ============================================

-- ============================================
-- PARTIE 1 : AUDIT
-- ============================================

-- 1. AUDIT DE LA TABLE courses
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY[
        'id', 'title', 'description', 'slug', 'cover_image', 
        'builder_snapshot', 'status', 'creator_id', 'created_at', 'updated_at',
        'published', 'hero_image_url', 'thumbnail_url', 'price', 'org_id'
    ];
    actual_columns TEXT[];
    missing_columns TEXT[];
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDIT TABLE: courses';
    RAISE NOTICE '========================================';
    
    SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'courses';
    
    RAISE NOTICE 'Colonnes réelles: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
END $$;

-- 2. AUDIT DE LA TABLE tests
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY[
        'id', 'title', 'description', 'evaluation_type', 'skills', 
        'category', 'cover_image', 'hero_image_url', 'thumbnail_url',
        'duration', 'timer_enabled', 'adaptive_mode', 'published', 
        'status', 'display_format', 'price', 'form_url', 'created_at', 
        'updated_at', 'creator_id', 'questions'
    ];
    actual_columns TEXT[];
    missing_columns TEXT[];
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDIT TABLE: tests';
    RAISE NOTICE '========================================';
    
    SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'tests';
    
    RAISE NOTICE 'Colonnes réelles: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
END $$;

-- 3. AUDIT DE LA TABLE resources
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY[
        'id', 'title', 'description', 'kind', 'file_url', 
        'cover_url', 'thumbnail_url', 'published', 'status',
        'price', 'category', 'created_at', 'updated_at', 
        'creator_id', 'org_id'
    ];
    actual_columns TEXT[];
    missing_columns TEXT[];
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDIT TABLE: resources';
    RAISE NOTICE '========================================';
    
    SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'resources';
    
    RAISE NOTICE 'Colonnes réelles: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
END $$;

-- 4. AUDIT DE LA TABLE enrollments
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY[
        'id', 'user_id', 'learner_id', 'course_id', 
        'progress', 'enrolled_at', 'created_at', 'role'
    ];
    actual_columns TEXT[];
    missing_columns TEXT[];
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDIT TABLE: enrollments';
    RAISE NOTICE '========================================';
    
    SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'enrollments';
    
    RAISE NOTICE 'Colonnes réelles: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
END $$;

-- ============================================
-- PARTIE 2 : CORRECTIONS AUTOMATIQUES
-- ============================================

-- CORRECTION 1 : Ajouter published à courses
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
        
        UPDATE courses 
        SET published = (status = 'published' OR status = 'active')
        WHERE published IS NULL OR published = false;
        
        RAISE NOTICE '✅ Valeurs de published mises à jour depuis status';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne published existe déjà dans courses';
    END IF;
END $$;

-- CORRECTION 2 : Ajouter hero_image_url à courses
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
        
        UPDATE courses 
        SET hero_image_url = cover_image
        WHERE cover_image IS NOT NULL AND hero_image_url IS NULL;
        
        RAISE NOTICE '✅ Valeurs de hero_image_url copiées depuis cover_image';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne hero_image_url existe déjà dans courses';
    END IF;
END $$;

-- CORRECTION 3 : Ajouter thumbnail_url à courses
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
        
        UPDATE courses 
        SET thumbnail_url = cover_image
        WHERE cover_image IS NOT NULL AND thumbnail_url IS NULL;
        
        RAISE NOTICE '✅ Valeurs de thumbnail_url copiées depuis cover_image';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne thumbnail_url existe déjà dans courses';
    END IF;
END $$;

-- CORRECTION 4 : Ajouter price à courses
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

-- ============================================
-- PARTIE 3 : RÉSUMÉ FINAL
-- ============================================
DO $$
DECLARE
    courses_has_published BOOLEAN;
    courses_has_hero_image BOOLEAN;
    courses_has_thumbnail BOOLEAN;
    courses_has_price BOOLEAN;
    courses_has_status BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ FINAL - TABLE courses';
    RAISE NOTICE '========================================';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'published'
    ) INTO courses_has_published;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'hero_image_url'
    ) INTO courses_has_hero_image;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'thumbnail_url'
    ) INTO courses_has_thumbnail;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'price'
    ) INTO courses_has_price;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'status'
    ) INTO courses_has_status;
    
    IF courses_has_published THEN
        RAISE NOTICE '✅ published: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ published: MANQUANTE';
    END IF;
    
    IF courses_has_hero_image THEN
        RAISE NOTICE '✅ hero_image_url: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ hero_image_url: MANQUANTE';
    END IF;
    
    IF courses_has_thumbnail THEN
        RAISE NOTICE '✅ thumbnail_url: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ thumbnail_url: MANQUANTE';
    END IF;
    
    IF courses_has_price THEN
        RAISE NOTICE '✅ price: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ price: MANQUANTE';
    END IF;
    
    IF courses_has_status THEN
        RAISE NOTICE '✅ status: PRÉSENTE';
    ELSE
        RAISE NOTICE '❌ status: MANQUANTE';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDIT TERMINÉ';
    RAISE NOTICE '========================================';
END $$;










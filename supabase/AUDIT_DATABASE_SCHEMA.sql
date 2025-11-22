-- ============================================
-- SCRIPT D'AUDIT DE LA STRUCTURE DE LA BASE DE DONNÉES
-- Compare la structure réelle avec ce que le code attend
-- ============================================

-- 1. AUDIT DE LA TABLE courses
-- ============================================
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY[
        'id', 'title', 'description', 'slug', 'cover_image', 
        'builder_snapshot', 'status', 'creator_id', 'created_at', 'updated_at',
        'published', 'hero_image_url', 'thumbnail_url', 'price', 'org_id'
    ];
    actual_columns TEXT[];
    missing_columns TEXT[];
    unexpected_columns TEXT[];
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDIT TABLE: courses';
    RAISE NOTICE '========================================';
    
    -- Récupérer les colonnes réelles
    SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'courses';
    
    RAISE NOTICE 'Colonnes réelles dans courses: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    -- Trouver les colonnes manquantes (attendues mais absentes)
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES (attendues par le code mais absentes):';
        RAISE NOTICE '   %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
    
    -- Trouver les colonnes inattendues (présentes mais non utilisées)
    unexpected_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY actual_columns
    LOOP
        IF NOT (col = ANY(expected_columns)) THEN
            unexpected_columns := array_append(unexpected_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(unexpected_columns, 1) > 0 THEN
        RAISE NOTICE 'ℹ️  COLONNES INATTENDUES (présentes mais non utilisées par le code):';
        RAISE NOTICE '   %', array_to_string(unexpected_columns, ', ');
    END IF;
    RAISE NOTICE '';
END $$;

-- 2. AUDIT DE LA TABLE tests
-- ============================================
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
    unexpected_columns TEXT[];
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
    
    RAISE NOTICE 'Colonnes réelles dans tests: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES:';
        RAISE NOTICE '   %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
    
    unexpected_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY actual_columns
    LOOP
        IF NOT (col = ANY(expected_columns)) THEN
            unexpected_columns := array_append(unexpected_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(unexpected_columns, 1) > 0 THEN
        RAISE NOTICE 'ℹ️  COLONNES INATTENDUES:';
        RAISE NOTICE '   %', array_to_string(unexpected_columns, ', ');
    END IF;
    RAISE NOTICE '';
END $$;

-- 3. AUDIT DE LA TABLE resources
-- ============================================
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
    unexpected_columns TEXT[];
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
    
    RAISE NOTICE 'Colonnes réelles dans resources: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES:';
        RAISE NOTICE '   %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
    
    unexpected_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY actual_columns
    LOOP
        IF NOT (col = ANY(expected_columns)) THEN
            unexpected_columns := array_append(unexpected_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(unexpected_columns, 1) > 0 THEN
        RAISE NOTICE 'ℹ️  COLONNES INATTENDUES:';
        RAISE NOTICE '   %', array_to_string(unexpected_columns, ', ');
    END IF;
    RAISE NOTICE '';
END $$;

-- 4. AUDIT DE LA TABLE paths
-- ============================================
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY[
        'id', 'title', 'description', 'slug', 'cover_image',
        'hero_image_url', 'thumbnail_url', 'status', 'published',
        'price', 'created_at', 'updated_at', 'creator_id', 'org_id'
    ];
    actual_columns TEXT[];
    missing_columns TEXT[];
    unexpected_columns TEXT[];
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDIT TABLE: paths';
    RAISE NOTICE '========================================';
    
    SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
    INTO actual_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'paths';
    
    RAISE NOTICE 'Colonnes réelles dans paths: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES:';
        RAISE NOTICE '   %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
    
    unexpected_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY actual_columns
    LOOP
        IF NOT (col = ANY(expected_columns)) THEN
            unexpected_columns := array_append(unexpected_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(unexpected_columns, 1) > 0 THEN
        RAISE NOTICE 'ℹ️  COLONNES INATTENDUES:';
        RAISE NOTICE '   %', array_to_string(unexpected_columns, ', ');
    END IF;
    RAISE NOTICE '';
END $$;

-- 5. AUDIT DE LA TABLE enrollments
-- ============================================
DO $$
DECLARE
    expected_columns TEXT[] := ARRAY[
        'id', 'user_id', 'learner_id', 'course_id', 
        'progress', 'enrolled_at', 'created_at', 'role'
    ];
    actual_columns TEXT[];
    missing_columns TEXT[];
    unexpected_columns TEXT[];
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
    
    RAISE NOTICE 'Colonnes réelles dans enrollments: %', array_to_string(actual_columns, ', ');
    RAISE NOTICE '';
    
    missing_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT (col = ANY(actual_columns)) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  COLONNES MANQUANTES:';
        RAISE NOTICE '   %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes attendues sont présentes';
    END IF;
    RAISE NOTICE '';
    
    unexpected_columns := ARRAY[]::TEXT[];
    FOREACH col IN ARRAY actual_columns
    LOOP
        IF NOT (col = ANY(expected_columns)) THEN
            unexpected_columns := array_append(unexpected_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(unexpected_columns, 1) > 0 THEN
        RAISE NOTICE 'ℹ️  COLONNES INATTENDUES:';
        RAISE NOTICE '   %', array_to_string(unexpected_columns, ', ');
    END IF;
    RAISE NOTICE '';
END $$;

-- 6. RÉSUMÉ DES PROBLÈMES IDENTIFIÉS
-- ============================================
DO $$
DECLARE
    courses_has_published BOOLEAN;
    courses_has_hero_image BOOLEAN;
    courses_has_thumbnail BOOLEAN;
    courses_has_status BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ DES INCOHÉRENCES CRITIQUES';
    RAISE NOTICE '========================================';
    
    -- Vérifier courses
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
          AND column_name = 'status'
    ) INTO courses_has_status;
    
    RAISE NOTICE 'TABLE courses:';
    IF NOT courses_has_published THEN
        RAISE NOTICE '  ❌ published: MANQUANTE (le code l''utilise)';
    ELSE
        RAISE NOTICE '  ✅ published: PRÉSENTE';
    END IF;
    
    IF NOT courses_has_hero_image THEN
        RAISE NOTICE '  ❌ hero_image_url: MANQUANTE (le code l''utilise)';
    ELSE
        RAISE NOTICE '  ✅ hero_image_url: PRÉSENTE';
    END IF;
    
    IF NOT courses_has_thumbnail THEN
        RAISE NOTICE '  ❌ thumbnail_url: MANQUANTE (le code l''utilise)';
    ELSE
        RAISE NOTICE '  ✅ thumbnail_url: PRÉSENTE';
    END IF;
    
    IF courses_has_status THEN
        RAISE NOTICE '  ✅ status: PRÉSENTE (utiliser status au lieu de published)';
    ELSE
        RAISE NOTICE '  ❌ status: MANQUANTE';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'RECOMMANDATIONS:';
    RAISE NOTICE '  1. Utiliser status au lieu de published pour courses';
    RAISE NOTICE '  2. Utiliser cover_image au lieu de hero_image_url/thumbnail_url';
    RAISE NOTICE '  3. Ou ajouter les colonnes manquantes si nécessaire';
    RAISE NOTICE '';
END $$;

-- 7. LISTE COMPLÈTE DES COLONNES PAR TABLE
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('courses', 'tests', 'resources', 'paths', 'enrollments', 'path_progress', 'cart_items', 'orders', 'order_items')
ORDER BY table_name, ordinal_position;









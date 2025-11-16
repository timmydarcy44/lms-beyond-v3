-- Script combiné pour corriger toutes les colonnes manquantes et RLS
-- À exécuter dans l'ordre dans Supabase SQL Editor

-- ============================================
-- 1. AJOUTER COLONNE DESCRIPTION À ORGANIZATIONS
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN description text;
        
        RAISE NOTICE '✓ Colonne "description" ajoutée à la table "organizations".';
    ELSE
        RAISE NOTICE '✓ Colonne "description" existe déjà dans la table "organizations".';
    END IF;
END $$;

-- ============================================
-- 2. AJOUTER COLONNE PRICE AUX TABLES DE CONTENU
-- ============================================
DO $$
BEGIN
    -- Table 'resources'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'price') THEN
        ALTER TABLE public.resources ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE '✓ Colonne "price" ajoutée à la table "resources".';
    ELSE
        RAISE NOTICE '✓ Colonne "price" existe déjà dans la table "resources".';
    END IF;

    -- Table 'tests'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'price') THEN
        ALTER TABLE public.tests ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE '✓ Colonne "price" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE '✓ Colonne "price" existe déjà dans la table "tests".';
    END IF;
    
    -- Table 'paths'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paths' AND column_name = 'price') THEN
        ALTER TABLE public.paths ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE '✓ Colonne "price" ajoutée à la table "paths".';
    ELSE
        RAISE NOTICE '✓ Colonne "price" existe déjà dans la table "paths".';
    END IF;

    -- Table 'courses'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'price') THEN
        ALTER TABLE public.courses ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE '✓ Colonne "price" ajoutée à la table "courses".';
    ELSE
        RAISE NOTICE '✓ Colonne "price" existe déjà dans la table "courses".';
    END IF;
END $$;

-- ============================================
-- 3. CORRIGER LES POLITIQUES RLS POUR ORGANIZATIONS
-- ============================================
-- Activer RLS si ce n'est pas déjà fait
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✓ RLS activé pour la table organizations';
    ELSE
        RAISE NOTICE '✓ RLS déjà activé pour la table organizations';
    END IF;
END $$;

-- Supprimer les anciennes politiques INSERT si elles existent
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
DROP POLICY IF EXISTS organizations_insert_all ON public.organizations;
DROP POLICY IF EXISTS organizations_insert_super_admin ON public.organizations;

-- Créer une politique INSERT pour permettre aux utilisateurs authentifiés de créer des organisations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
        AND policyname = 'organizations_insert'
    ) THEN
        CREATE POLICY organizations_insert ON public.organizations
            FOR INSERT
            TO authenticated
            WITH CHECK (true);
        
        RAISE NOTICE '✓ Politique INSERT organizations_insert créée avec succès';
    ELSE
        RAISE NOTICE '✓ Politique INSERT organizations_insert existe déjà';
    END IF;
END $$;

-- ============================================
-- 4. VÉRIFICATION FINALE
-- ============================================
DO $$
DECLARE
    desc_exists BOOLEAN;
    price_resources_exists BOOLEAN;
    price_tests_exists BOOLEAN;
    price_paths_exists BOOLEAN;
    price_courses_exists BOOLEAN;
    insert_policy_exists BOOLEAN;
BEGIN
    -- Vérifier colonne description
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'description'
    ) INTO desc_exists;
    
    -- Vérifier colonnes price
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'price'
    ) INTO price_resources_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tests' 
        AND column_name = 'price'
    ) INTO price_tests_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'paths' 
        AND column_name = 'price'
    ) INTO price_paths_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'price'
    ) INTO price_courses_exists;
    
    -- Vérifier politique INSERT
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
        AND policyname = 'organizations_insert'
    ) INTO insert_policy_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RÉSUMÉ DES VÉRIFICATIONS ===';
    RAISE NOTICE 'Colonne organizations.description: %', CASE WHEN desc_exists THEN '✓ Existe' ELSE '✗ Manquante' END;
    RAISE NOTICE 'Colonne resources.price: %', CASE WHEN price_resources_exists THEN '✓ Existe' ELSE '✗ Manquante' END;
    RAISE NOTICE 'Colonne tests.price: %', CASE WHEN price_tests_exists THEN '✓ Existe' ELSE '✗ Manquante' END;
    RAISE NOTICE 'Colonne paths.price: %', CASE WHEN price_paths_exists THEN '✓ Existe' ELSE '✗ Manquante' END;
    RAISE NOTICE 'Colonne courses.price: %', CASE WHEN price_courses_exists THEN '✓ Existe' ELSE '✗ Manquante' END;
    RAISE NOTICE 'Politique RLS organizations_insert: %', CASE WHEN insert_policy_exists THEN '✓ Existe' ELSE '✗ Manquante' END;
    RAISE NOTICE '';
END $$;




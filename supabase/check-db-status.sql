-- Script de vérification rapide de l'état de la base de données
-- À exécuter dans Supabase Studio → SQL Editor
-- Vous permet de voir ce qui est déjà en place et ce qui manque

-- 1. Liste des tables existantes
SELECT 
    'Tables existantes' as check_type,
    table_name,
    '✅ Table existe' as status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Vérifier les colonnes de la table profiles
SELECT 
    'Colonnes profiles' as check_type,
    column_name,
    CASE 
        WHEN column_name IN ('id', 'role', 'email', 'full_name', 'first_name', 'last_name', 'phone', 'avatar_url', 'display_name', 'created_at')
        THEN '✅ Colonne présente'
        ELSE '⚠️ Colonne inattendue'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Colonnes manquantes dans profiles (si existantes)
SELECT 
    'Colonnes manquantes profiles' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email')
        THEN '❌ email manquante'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name')
        THEN '❌ full_name manquante'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name')
        THEN '❌ first_name manquante'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name')
        THEN '❌ last_name manquante'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone')
        THEN '❌ phone manquante'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url')
        THEN '❌ avatar_url manquante'
        ELSE NULL
    END as status
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles')
HAVING status IS NOT NULL;

-- 4. Vérifier les tables critiques
SELECT 
    'Tables critiques' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
        THEN '✅ profiles'
        ELSE '❌ profiles manquante'
    END as profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses')
        THEN '✅ courses'
        ELSE '❌ courses manquante'
    END as courses_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
        THEN '✅ organizations'
        ELSE '❌ organizations manquante'
    END as organizations_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups')
        THEN '✅ groups'
        ELSE '❌ groups manquante'
    END as groups_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drive_documents')
        THEN '✅ drive_documents'
        ELSE '❌ drive_documents manquante'
    END as drive_documents_status;

-- 5. Vérifier la fonction user_has_role
SELECT 
    'Fonctions' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'user_has_role' AND routine_schema = 'public')
        THEN '✅ user_has_role existe'
        ELSE '❌ user_has_role manquante'
    END as status;




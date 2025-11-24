-- AUDIT RAPIDE - Version simplifiée
-- Copiez-collez les résultats de chaque requête

-- 1. Toutes les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Colonnes de resources (si elle existe)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'resources'
ORDER BY ordinal_position;

-- 3. Colonnes de courses (si elle existe)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'courses'
ORDER BY ordinal_position;

-- 4. Colonnes de profiles (si elle existe)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;










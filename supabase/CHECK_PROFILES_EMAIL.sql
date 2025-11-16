-- Vérifier si la table profiles a une colonne email
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name = 'email';

-- Si la colonne n'existe pas, on devra utiliser auth.users via une vue ou une autre méthode




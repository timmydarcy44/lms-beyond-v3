-- Script pour définir un mot de passe pour Dany Pain
-- Note: Cette méthode nécessite le service role key ou doit être exécutée via l'API Supabase Auth

-- Option 1: Via l'interface Supabase (RECOMMANDÉ)
-- 1. Allez dans Authentication > Users
-- 2. Trouvez paindany36@gmail.com
-- 3. Cliquez sur les trois points (...) > "Send password reset email"
-- 4. Dany recevra un email pour définir son mot de passe

-- Option 2: Via l'API Supabase Auth (si vous avez le service role key)
-- Utilisez cette requête pour envoyer un email de réinitialisation de mot de passe
-- ou définir directement un mot de passe via l'API

-- Vérification: Vérifier si l'utilisateur existe
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'paindany36@gmail.com';

-- Note: Pour définir un mot de passe directement, vous devez utiliser l'API Supabase Auth
-- avec le service role key, car les mots de passe sont hashés et ne peuvent pas être
-- définis directement via SQL pour des raisons de sécurité.









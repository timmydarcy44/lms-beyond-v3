# Configuration des redirections Supabase pour la réinitialisation de mot de passe

## Problème
Quand un utilisateur clique sur le lien de réinitialisation de mot de passe dans l'email, il est redirigé vers `/login` au lieu de `/reset-password`.

## Solution implémentée
La page `/login` détecte maintenant automatiquement si un code de réinitialisation est présent dans l'URL et redirige vers `/reset-password`.

## Configuration Supabase (optionnel)

Pour une meilleure expérience, vous pouvez aussi configurer les URLs de redirection dans Supabase :

1. Allez dans votre projet Supabase
2. Allez dans **Authentication** > **URL Configuration**
3. Dans **Redirect URLs**, ajoutez :
   - `http://localhost:3000/reset-password` (pour le développement)
   - `https://votre-domaine.com/reset-password` (pour la production)
4. Dans **Site URL**, assurez-vous que l'URL de base est correcte

## Comment ça fonctionne maintenant

1. L'utilisateur reçoit un email avec un lien de réinitialisation
2. Le lien pointe vers `/login?code=XXX&type=recovery`
3. La page `/login` détecte le code et redirige automatiquement vers `/reset-password?code=XXX`
4. La page `/reset-password` échange le code contre une session et permet de définir un nouveau mot de passe

## Test

Pour tester :
1. Envoyez un email de réinitialisation à `paindany36@gmail.com`
2. Cliquez sur le lien dans l'email
3. Vous devriez être automatiquement redirigé vers `/reset-password`
4. Définissez un nouveau mot de passe





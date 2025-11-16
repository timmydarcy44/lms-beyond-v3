# Définir le mot de passe pour Dany Pain

## Problème
L'utilisateur `paindany36@gmail.com` existe dans la base de données mais n'a pas de mot de passe défini, ce qui empêche la connexion.

## Solutions

### Solution 1 : Envoyer un email de réinitialisation (RECOMMANDÉ)

1. Allez dans votre projet Supabase
2. Allez dans **Authentication** > **Users**
3. Trouvez `paindany36@gmail.com`
4. Cliquez sur les **trois points (...)** à droite de l'utilisateur
5. Sélectionnez **"Send password reset email"**
6. Dany recevra un email avec un lien pour définir son mot de passe

### Solution 2 : Définir un mot de passe via l'API (si vous avez le service role key)

Utilisez cette commande curl (remplacez `YOUR_PROJECT_REF` et `YOUR_SERVICE_ROLE_KEY`) :

```bash
curl -X PUT 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users/USER_ID' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "UN_MOT_DE_PASSE_SECURISE",
    "email_confirm": true
  }'
```

**Pour obtenir l'USER_ID** :
1. Allez dans Authentication > Users
2. Cliquez sur `paindany36@gmail.com`
3. Copiez l'UUID affiché (c'est l'ID de l'utilisateur)

### Solution 3 : Créer un nouvel utilisateur avec mot de passe (si nécessaire)

Si l'utilisateur n'a pas été créé correctement, vous pouvez le recréer via l'interface Supabase :

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **"Add user"** > **"Create new user"**
3. Remplissez :
   - **Email**: `paindany36@gmail.com`
   - **Password**: (définissez un mot de passe sécurisé)
   - **Auto Confirm User**: ✅ (cocher)
4. Cliquez sur **"Create user"**
5. Le profil et le membership existent déjà, donc l'utilisateur sera automatiquement lié

## Vérification

Après avoir défini le mot de passe, Dany devrait pouvoir se connecter avec :
- **Email**: `paindany36@gmail.com`
- **Mot de passe**: (celui défini via l'email de réinitialisation ou l'API)

## Note importante

Les mots de passe sont hashés et ne peuvent pas être définis directement via SQL pour des raisons de sécurité. Vous devez utiliser l'interface Supabase ou l'API Auth.




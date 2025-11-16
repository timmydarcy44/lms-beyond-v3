# Création de l'utilisateur Dany Pain et de l'organisation Paris Saint Germain

## Étapes à suivre

### 1. Créer l'utilisateur dans Supabase Auth

**Option A : Via l'interface Supabase**
1. Allez dans votre projet Supabase
2. Allez dans "Authentication" > "Users"
3. Cliquez sur "Add user" > "Create new user"
4. Remplissez :
   - **Email**: `paindany36@gmail.com`
   - **Password**: (générez un mot de passe sécurisé ou laissez Supabase en générer un)
   - **Auto Confirm User**: ✅ (cocher pour activer directement)
5. Cliquez sur "Create user"
6. **Important** : Copiez l'UUID de l'utilisateur créé (vous en aurez besoin)

**Option B : Via l'API (si vous préférez)**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paindany36@gmail.com",
    "password": "UN_MOT_DE_PASSE_SECURISE",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Dany Pain"
    }
  }'
```

### 2. Exécuter le script SQL

Une fois l'utilisateur créé dans `auth.users`, exécutez le script :
```sql
supabase/CREATE_USER_DANY_AND_ORG_PSG.sql
```

Ce script va :
- ✅ Créer l'organisation "Paris Saint Germain"
- ✅ Créer/mettre à jour le profil de Dany Pain
- ✅ Créer le membership admin pour Dany dans l'organisation

### 3. Vérification

Le script affichera un résumé final avec :
- Le nom de l'organisation
- Les informations de l'utilisateur
- Le rôle dans l'organisation

## Notes importantes

- L'utilisateur doit exister dans `auth.users` avant d'exécuter le script SQL
- Si l'utilisateur n'existe pas, le script créera quand même l'organisation mais affichera un avertissement
- Vous pouvez réexécuter le script après avoir créé l'utilisateur pour créer le membership

## Envoi de l'email d'invitation (optionnel)

Si vous voulez envoyer un email d'invitation à Dany :
1. Allez dans "Authentication" > "Users"
2. Trouvez `paindany36@gmail.com`
3. Cliquez sur les trois points (...) > "Send password reset email"
4. Ou utilisez l'API pour envoyer un email d'invitation





# Définir le mot de passe pour Dany Pain

## Solution 1 : Via l'interface Super Admin (RECOMMANDÉ)

1. Connectez-vous en tant que Super Admin (`timdarcypro@gmail.com`)
2. Allez sur : `http://localhost:3000/super/admin/set-password`
3. Le formulaire est pré-rempli avec :
   - Email : `paindany36@gmail.com`
   - Mot de passe : `caentraining14`
4. Cliquez sur "Définir le mot de passe"
5. Le mot de passe sera défini automatiquement

## Solution 2 : Ajouter SUPABASE_SERVICE_ROLE_KEY dans .env.local

Si la Solution 1 ne fonctionne pas, ajoutez la clé service role dans `.env.local` :

1. Allez dans votre projet Supabase
2. Allez dans **Settings** > **API**
3. Copiez la **service_role key** (⚠️ NE JAMAIS la partager publiquement)
4. Ajoutez-la dans `.env.local` :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ici
   ```
5. Redémarrez le serveur (`npm run dev`)
6. Retournez sur `/super/admin/set-password` et réessayez

## Solution 3 : Via l'interface Supabase (si les autres ne fonctionnent pas)

1. Allez dans votre projet Supabase
2. Allez dans **Authentication** > **Users**
3. Trouvez `paindany36@gmail.com`
4. Cliquez sur les **trois points (...)** > **"Update user"**
5. Dans le champ **"Password"**, entrez : `caentraining14`
6. Cliquez sur **"Update"**

## Après avoir défini le mot de passe

Dany peut maintenant se connecter avec :
- **Email** : `paindany36@gmail.com`
- **Mot de passe** : `caentraining14`

## Sécurité

⚠️ **IMPORTANT** : Après avoir défini le mot de passe, supprimez :
- La page `/super/admin/set-password` (ou protégez-la avec une vérification Super Admin)
- La route API `/api/admin/set-password` (ou ajoutez une vérification Super Admin)

Ces fichiers sont temporaires et ne doivent pas rester en production.





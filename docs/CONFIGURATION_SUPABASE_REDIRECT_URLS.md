# Configuration des URLs de redirection Supabase

## Problème
Quand vous cliquez sur le lien de réinitialisation de mot de passe dans l'email, vous êtes redirigé vers `localhost` au lieu de l'URL de production.

## Solution

### 1. Configurer les URLs de redirection dans Supabase

1. Allez dans votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **URL Configuration**
4. Dans la section **Redirect URLs**, ajoutez :
   - `http://localhost:3000/reset-password` (pour le développement local)
   - `https://votre-domaine-vercel.vercel.app/reset-password` (remplacez par votre URL Vercel)
   - `https://votre-domaine.com/reset-password` (si vous avez un domaine personnalisé)

5. Dans **Site URL**, mettez votre URL de production :
   - `https://votre-domaine-vercel.vercel.app` (ou votre domaine personnalisé)

### 2. Vérifier la variable d'environnement NEXT_PUBLIC_APP_URL

Dans Vercel :
1. Allez dans votre projet Vercel
2. **Settings** > **Environment Variables**
3. Vérifiez que `NEXT_PUBLIC_APP_URL` est défini avec votre URL de production :
   - `https://votre-domaine-vercel.vercel.app`

### 3. Créer le compte contentin.cabinet@gmail.com

Si le compte n'existe pas :

1. **Option A : Via l'interface Supabase**
   - Allez dans **Authentication** > **Users**
   - Cliquez sur **Add User**
   - Email : `contentin.cabinet@gmail.com`
   - Mot de passe : (définissez un mot de passe temporaire)
   - Auto Confirm User : ✅ (cocher)
   - Cliquez sur **Create User**

2. **Option B : Via SQL**
   - Exécutez le script `supabase/CREATE_CONTENTIN_ACCOUNT.sql` dans l'éditeur SQL de Supabase
   - Note : Vous devrez d'abord créer l'utilisateur via l'interface Auth, puis exécuter le script pour mettre à jour le profil

3. **Après création du compte**
   - Exécutez le script SQL pour mettre à jour le rôle :
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin',
       full_name = 'Jessica Contentin'
   WHERE email = 'contentin.cabinet@gmail.com';
   ```

### 4. Réinitialiser le mot de passe

Une fois le compte créé et les URLs configurées :
1. Allez sur `/forgot-password`
2. Entrez `contentin.cabinet@gmail.com`
3. Cliquez sur "Envoyer le lien"
4. Vérifiez votre email
5. Le lien devrait maintenant rediriger vers votre URL de production

## Vérification

Pour vérifier que tout fonctionne :
1. Le compte existe dans Supabase Auth (Authentication > Users)
2. Le profil existe dans la table `profiles` avec `role = 'super_admin'`
3. Les URLs de redirection sont configurées dans Supabase
4. `NEXT_PUBLIC_APP_URL` est défini dans Vercel


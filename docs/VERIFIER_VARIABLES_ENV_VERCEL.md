# Vérifier les variables d'environnement sur Vercel

## Problème
La connexion fonctionne en local mais pas sur le déploiement Vercel.

## Solution : Vérifier les variables d'environnement

### 1. Variables requises sur Vercel

Allez dans votre projet Vercel :
1. **Settings** > **Environment Variables**
2. Vérifiez que ces variables sont définies pour **Production**, **Preview**, et **Development** :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-complète
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role-complète
NEXT_PUBLIC_APP_URL=https://votre-projet.vercel.app
```

### 2. Comment obtenir les valeurs

1. **Allez sur Supabase** : https://supabase.com/dashboard
2. **Sélectionnez votre projet**
3. **Settings** > **API**
4. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (très longue clé)
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (très longue clé, gardez-la secrète)

### 3. Vérifier dans Vercel

1. **Settings** > **Environment Variables**
2. Pour chaque variable, vérifiez :
   - ✅ Elle est présente
   - ✅ La valeur est complète (pas tronquée)
   - ✅ Elle est assignée à **Production** (et Preview/Development si nécessaire)
   - ✅ Pas d'espaces avant/après

### 4. Redéployer après modification

Après avoir ajouté/modifié des variables :
1. Allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. **Redeploy** (ou faites un nouveau commit)

### 5. Vérifier les logs

1. Allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. **Functions** > **View Function Logs**
4. Cherchez les erreurs liées à Supabase ou aux variables d'environnement

### 6. Vérifier la configuration Supabase

Dans Supabase :
1. **Authentication** > **URL Configuration**
2. **Site URL** : `https://votre-projet.vercel.app`
3. **Redirect URLs** : Ajoutez :
   - `https://votre-projet.vercel.app/**`
   - `http://localhost:3000/**` (pour le dev local)

## Test

1. Ouvrez la console du navigateur (F12) sur votre site Vercel
2. Allez sur `/login`
3. Regardez les logs dans la console
4. Si vous voyez des erreurs comme "Supabase environment variables are missing", les variables ne sont pas correctement configurées

## Erreurs courantes

- **"Invalid API key"** → La clé `NEXT_PUBLIC_SUPABASE_ANON_KEY` est incorrecte ou incomplète
- **"Supabase n'est pas configuré"** → Les variables ne sont pas définies sur Vercel
- **"Network error"** → Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est correct
- **Connexion réussie mais redirection échoue** → Vérifiez `NEXT_PUBLIC_APP_URL`


# Guide de déploiement sur Vercel

## Prérequis

1. Un compte Vercel (gratuit ou payant)
2. Un compte GitHub/GitLab/Bitbucket pour le repository
3. Les variables d'environnement configurées

## Étapes de déploiement

### 1. Préparer le repository

Assurez-vous que votre code est poussé sur GitHub/GitLab/Bitbucket :

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connecter le projet à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez votre repository GitHub/GitLab/Bitbucket
4. Vercel détectera automatiquement Next.js

### 3. Configurer les variables d'environnement

Dans les paramètres du projet Vercel, ajoutez toutes les variables d'environnement nécessaires :

#### Variables Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role Supabase (⚠️ SECRET)

#### Variables OpenAI
- `OPENAI_API_KEY` - Clé API OpenAI (⚠️ SECRET)

#### Variables Anthropic (si utilisé)
- `ANTHROPIC_API_KEY` - Clé API Anthropic (⚠️ SECRET)

#### Variables Stripe (si utilisé)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Clé publique Stripe
- `STRIPE_SECRET_KEY` - Clé secrète Stripe (⚠️ SECRET)

#### Variables Resend (si utilisé)
- `RESEND_API_KEY` - Clé API Resend (⚠️ SECRET)

#### Variables Google Cloud (si utilisé)
- `GOOGLE_APPLICATION_CREDENTIALS` - Credentials Google Cloud (⚠️ SECRET)
- Ou les variables individuelles si vous utilisez des credentials JSON

#### Variables d'application
- `NEXT_PUBLIC_APP_URL` - URL de votre application (ex: `https://votre-app.vercel.app`)

### 4. Configuration du build

Vercel détectera automatiquement Next.js et utilisera :
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 5. Déploiement

1. Cliquez sur "Deploy"
2. Vercel va :
   - Installer les dépendances
   - Builder l'application
   - Déployer sur leur infrastructure
3. Vous recevrez une URL de déploiement (ex: `https://votre-app.vercel.app`)

### 6. Configuration post-déploiement

#### Mettre à jour les URLs dans Supabase

1. Allez dans Supabase Dashboard > Authentication > URL Configuration
2. Ajoutez votre URL Vercel dans :
   - **Site URL**: `https://votre-app.vercel.app`
   - **Redirect URLs**: `https://votre-app.vercel.app/**`

#### Mettre à jour les webhooks Stripe (si utilisé)

1. Allez dans Stripe Dashboard > Developers > Webhooks
2. Mettez à jour l'URL du webhook avec votre URL Vercel

## Variables d'environnement importantes

### ⚠️ Variables secrètes (ne jamais commiter)

Ces variables doivent être ajoutées dans Vercel Dashboard > Settings > Environment Variables :

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS` (ou les credentials Google Cloud)

### Variables publiques (peuvent être dans le code)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Dépannage

### Erreur de build

1. Vérifiez les logs de build dans Vercel Dashboard
2. Vérifiez que toutes les dépendances sont dans `package.json`
3. Vérifiez que les variables d'environnement sont correctement configurées

### Erreur de runtime

1. Vérifiez les logs de runtime dans Vercel Dashboard
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que les URLs dans Supabase sont correctement configurées

### Problèmes de CORS

1. Vérifiez que l'URL Vercel est ajoutée dans Supabase Dashboard > Authentication > URL Configuration
2. Vérifiez que les politiques RLS dans Supabase sont correctement configurées

## Commandes utiles

### Déployer depuis la ligne de commande

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

### Voir les logs

```bash
vercel logs
```

## Support

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Support Vercel](https://vercel.com/support)


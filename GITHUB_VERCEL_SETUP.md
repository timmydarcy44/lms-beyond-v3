# Guide de déploiement GitHub + Vercel

## Repository GitHub
**URL**: https://github.com/timmydarcy44/lms-beyond-v3.git

## Étapes pour pousser le code sur GitHub

### 1. Initialiser Git (si pas déjà fait)

```bash
git init
```

### 2. Ajouter le remote GitHub

```bash
git remote add origin https://github.com/timmydarcy44/lms-beyond-v3.git
```

Ou si le remote existe déjà, le mettre à jour :
```bash
git remote set-url origin https://github.com/timmydarcy44/lms-beyond-v3.git
```

### 3. Vérifier le .gitignore

Assurez-vous que `.gitignore` contient :
```
node_modules
.next
.env.local
.env*.local
.vercel
```

### 4. Ajouter tous les fichiers

```bash
git add .
```

### 5. Faire le commit initial

```bash
git commit -m "Initial commit: LMS Beyond v3 with Vercel configuration"
```

### 6. Pousser sur GitHub

```bash
git branch -M main
git push -u origin main
```

Si vous avez des erreurs de permission, vous devrez peut-être vous authentifier avec GitHub.

## Déploiement sur Vercel

### Option 1 : Via le Dashboard Vercel (Recommandé)

1. **Aller sur [vercel.com](https://vercel.com)** et se connecter
2. **Cliquer sur "Add New Project"**
3. **Importer le repository GitHub** :
   - Sélectionner `timmydarcy44/lms-beyond-v3`
   - Vercel détectera automatiquement Next.js
4. **Configurer les variables d'environnement** (voir section ci-dessous)
5. **Cliquer sur "Deploy"**

### Option 2 : Via la CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer (première fois)
vercel

# Déployer en production
vercel --prod
```

## Variables d'environnement à configurer dans Vercel

Dans **Vercel Dashboard > Settings > Environment Variables**, ajoutez :

### Obligatoires

```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
OPENAI_API_KEY=votre_cle_openai
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

### Optionnelles (selon vos fonctionnalités)

```
ANTHROPIC_API_KEY=votre_cle_anthropic
STRIPE_SECRET_KEY=votre_cle_stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=votre_cle_stripe_publique
RESEND_API_KEY=votre_cle_resend
GOOGLE_APPLICATION_CREDENTIALS=votre_credentials_google
```

**⚠️ Important** : `NEXT_PUBLIC_APP_URL` doit être défini **après** le premier déploiement avec l'URL Vercel générée.

## Configuration post-déploiement

### 1. Mettre à jour Supabase

1. Aller dans **Supabase Dashboard > Authentication > URL Configuration**
2. Ajouter dans **Site URL** : `https://votre-app.vercel.app`
3. Ajouter dans **Redirect URLs** : `https://votre-app.vercel.app/**`

### 2. Mettre à jour NEXT_PUBLIC_APP_URL

1. Dans **Vercel Dashboard > Settings > Environment Variables**
2. Mettre à jour `NEXT_PUBLIC_APP_URL` avec l'URL Vercel
3. Redéployer (ou attendre le prochain déploiement automatique)

### 3. Tester l'application

- Vérifier que l'application se charge
- Tester l'authentification
- Vérifier les API routes
- Vérifier les logs pour les erreurs

## Déploiements automatiques

Une fois connecté à GitHub, Vercel déploiera automatiquement :
- À chaque push sur `main` → Production
- À chaque pull request → Preview

## Commandes utiles

### Voir les logs Vercel
```bash
vercel logs
```

### Lister les déploiements
```bash
vercel ls
```

### Ouvrir le dashboard
```bash
vercel dashboard
```

## Dépannage

### Erreur de build
- Vérifier les logs dans Vercel Dashboard
- Vérifier que toutes les dépendances sont dans `package.json`
- Vérifier les variables d'environnement

### Erreur d'authentification
- Vérifier que les URLs sont correctement configurées dans Supabase
- Vérifier que `NEXT_PUBLIC_APP_URL` est défini

### Erreur CORS
- Vérifier que l'URL Vercel est dans Supabase Dashboard > Authentication > URL Configuration

## Support

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Support Vercel](https://vercel.com/support)


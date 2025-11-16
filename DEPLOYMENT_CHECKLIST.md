# Checklist de déploiement Vercel

## ✅ Avant le déploiement

### 1. Code
- [ ] Code poussé sur GitHub/GitLab/Bitbucket
- [ ] Pas de fichiers sensibles dans le repository
- [ ] `.env.local` dans `.gitignore`
- [ ] `vercel.json` créé
- [ ] `.vercelignore` créé

### 2. Variables d'environnement à configurer dans Vercel

#### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ SECRET

#### OpenAI
- [ ] `OPENAI_API_KEY` ⚠️ SECRET

#### Anthropic (si utilisé)
- [ ] `ANTHROPIC_API_KEY` ⚠️ SECRET

#### Stripe (si utilisé)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY` ⚠️ SECRET

#### Resend (si utilisé)
- [ ] `RESEND_API_KEY` ⚠️ SECRET

#### Google Cloud (si utilisé)
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` ⚠️ SECRET
- Ou les variables individuelles

#### Application
- [ ] `NEXT_PUBLIC_APP_URL` (à définir après le premier déploiement)

### 3. Configuration Supabase

- [ ] URL de redirection ajoutée dans Supabase Dashboard > Authentication > URL Configuration
- [ ] Site URL configurée avec l'URL Vercel
- [ ] Redirect URLs incluent `https://votre-app.vercel.app/**`

### 4. Configuration Stripe (si utilisé)

- [ ] Webhooks configurés avec l'URL Vercel
- [ ] URLs de redirection configurées

## 🚀 Déploiement

1. [ ] Aller sur [vercel.com](https://vercel.com)
2. [ ] Cliquer sur "Add New Project"
3. [ ] Importer le repository
4. [ ] Configurer les variables d'environnement
5. [ ] Cliquer sur "Deploy"
6. [ ] Attendre la fin du build
7. [ ] Vérifier que le déploiement est réussi

## ✅ Après le déploiement

1. [ ] Tester l'application sur l'URL Vercel
2. [ ] Mettre à jour `NEXT_PUBLIC_APP_URL` avec l'URL Vercel
3. [ ] Mettre à jour les URLs dans Supabase
4. [ ] Tester l'authentification
5. [ ] Tester les fonctionnalités principales
6. [ ] Vérifier les logs pour les erreurs

## 🔍 Vérifications

- [ ] L'application se charge correctement
- [ ] L'authentification fonctionne
- [ ] Les API routes fonctionnent
- [ ] Les images se chargent correctement
- [ ] Pas d'erreurs dans la console
- [ ] Pas d'erreurs dans les logs Vercel

## 📝 Notes

- Les variables avec ⚠️ SECRET ne doivent jamais être commitées
- Vercel détecte automatiquement Next.js
- Le build peut prendre quelques minutes
- Les déploiements suivants seront automatiques si vous avez activé GitHub integration



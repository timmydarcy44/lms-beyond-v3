# Guide d'Implémentation Multi-Tenant

## ✅ Ce qui a été implémenté

### 1. Configuration des Tenants
- ✅ Fichier `src/lib/tenant/config.ts` avec la configuration des 3 tenants
- ✅ Support pour `beyond-noschool.fr`, `beyond-care.fr`, `beyond-note.fr`
- ✅ Support pour `localhost:3000` en développement

### 2. Middleware de Détection
- ✅ Fichier `src/app/middleware.ts` qui détecte automatiquement le tenant
- ✅ Ajoute les headers `x-tenant-id`, `x-tenant-domain`, etc.
- ✅ Stocke le tenant dans les cookies pour le client-side

### 3. APIs
- ✅ `/api/auth/signup-email-only` - Inscription simplifiée (email uniquement)
- ✅ `/api/subscriptions/create` - Création d'une session Stripe Checkout
- ✅ `/api/subscriptions/webhook` - Webhook Stripe pour mettre à jour les abonnements
- ✅ `/api/subscriptions/check` - Vérifier si un utilisateur a un abonnement actif

### 4. Pages
- ✅ `/(tenant)/page.tsx` - Landing page dynamique selon le tenant
- ✅ `/(tenant)/signup/check-email` - Page de confirmation email
- ✅ `/(tenant)/auth/set-password` - Page de définition du mot de passe
- ✅ `/(tenant)/subscription` - Page de choix d'abonnement

### 5. Composants
- ✅ `components/tenant/landing-page.tsx` - Landing page style Netflix
- ✅ Fonctions utilitaires dans `lib/tenant/detection.ts`
- ✅ Fonctions de vérification d'abonnement dans `lib/subscriptions/check-access.ts`

### 6. Base de Données
- ✅ Script SQL `supabase/CREATE_SUBSCRIPTIONS_TABLE.sql` pour créer la table `subscriptions`

---

## 🚀 Prochaines Étapes

### 1. Exécuter le Script SQL

```bash
# Dans Supabase SQL Editor, exécutez :
supabase/CREATE_SUBSCRIPTIONS_TABLE.sql
```

### 2. Configurer Stripe

Ajoutez dans `.env.local` :

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Configurer le Webhook Stripe

1. Allez dans Stripe Dashboard > Developers > Webhooks
2. Ajoutez un endpoint : `https://votre-domaine.com/api/subscriptions/webhook`
3. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiez le `Signing secret` dans `STRIPE_WEBHOOK_SECRET`

### 4. Tester en Local

1. Modifiez votre `/etc/hosts` (Mac/Linux) ou `C:\Windows\System32\drivers\etc\hosts` (Windows) :
   ```
   127.0.0.1 beyond-noschool.local
   127.0.0.1 beyond-care.local
   127.0.0.1 beyond-note.local
   ```

2. Ajoutez dans `src/lib/tenant/config.ts` :
   ```typescript
   'beyond-noschool.local:3000': { ... },
   'beyond-care.local:3000': { ... },
   'beyond-note.local:3000': { ... },
   ```

3. Accédez à `http://beyond-noschool.local:3000`

### 5. Déployer sur Vercel

1. Ajoutez les domaines dans Vercel :
   - `beyond-noschool.fr`
   - `beyond-care.fr`
   - `beyond-note.fr`

2. Configurez les DNS pour pointer vers Vercel

3. Vérifiez que les variables d'environnement sont configurées

---

## 📝 Flux Utilisateur

### Inscription
1. Utilisateur arrive sur `beyond-noschool.fr`
2. Landing page s'affiche avec le branding du tenant
3. Utilisateur entre son email et clique sur "Commencer"
4. Email de confirmation est envoyé
5. Utilisateur clique sur le lien dans l'email
6. Page de définition du mot de passe s'affiche
7. Après définition du mot de passe, redirection vers `/subscription`
8. Utilisateur choisit un plan (mensuel/annuel)
9. Redirection vers Stripe Checkout
10. Après paiement, webhook Stripe met à jour la base de données
11. Redirection vers `/dashboard` avec accès complet

### Vérification d'Abonnement

Dans vos pages protégées, utilisez :

```typescript
import { hasActiveSubscription } from '@/lib/subscriptions/check-access';
import { getTenantFromHeaders } from '@/lib/tenant/detection';

const tenant = await getTenantFromHeaders();
const hasAccess = await hasActiveSubscription(user.id, tenant.id);

if (!hasAccess) {
  redirect('/subscription');
}
```

---

## 🔧 Personnalisation

### Modifier les Prix

Éditez `src/lib/tenant/config.ts` :

```typescript
subscriptionPlans: {
  monthly: 29.99,  // Modifier ici
  yearly: 299.99,  // Modifier ici
},
```

### Modifier le Branding

Le branding est récupéré depuis la table `super_admin_branding` en base de données. 
Modifiez-le via l'interface Super Admin ou directement en SQL.

### Ajouter un Nouveau Tenant

1. Ajoutez dans `src/lib/tenant/config.ts` :
   ```typescript
   'nouveau-tenant.fr': {
     id: 'nouveau-tenant',
     domain: 'nouveau-tenant.fr',
     name: 'Nouveau Tenant',
     superAdminEmail: 'admin@example.com',
     features: { ... },
     subscriptionPlans: { ... },
   },
   ```

2. Ajoutez le domaine dans Vercel

3. Configurez le DNS

---

## 🐛 Dépannage

### Le tenant n'est pas détecté
- Vérifiez que le domaine est bien dans `TENANTS` dans `config.ts`
- Vérifiez les logs du middleware dans la console

### L'inscription ne fonctionne pas
- Vérifiez que Supabase Auth est configuré
- Vérifiez les emails de confirmation dans Supabase Dashboard > Authentication > Email Templates

### Le webhook Stripe ne fonctionne pas
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Vérifiez les logs dans Stripe Dashboard > Developers > Webhooks
- Testez avec Stripe CLI : `stripe listen --forward-to localhost:3000/api/subscriptions/webhook`

### L'abonnement n'est pas créé après paiement
- Vérifiez que le webhook est bien configuré
- Vérifiez les logs du webhook dans la console
- Vérifiez que la table `subscriptions` existe en base

---

## 📚 Ressources

- [Documentation Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Documentation Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)





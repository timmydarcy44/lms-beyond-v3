# Configuration Stripe pour le Panier E-commerce

## 📋 Prérequis

1. Un compte Stripe (gratuit) : https://stripe.com
2. Les clés API Stripe (disponibles dans le Dashboard Stripe)

## 🔑 Étape 1 : Obtenir vos clés API Stripe

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com)
2. Allez dans **Developers** > **API keys**
3. Vous verrez deux clés :
   - **Publishable key** (commence par `pk_test_` ou `pk_live_`)
   - **Secret key** (commence par `sk_test_` ou `sk_live_`)

⚠️ **Important** : Utilisez les clés de **test** (`_test_`) pour le développement, et les clés **live** (`_live_`) pour la production.

## 🔧 Étape 2 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Stripe - Clés de test (développement)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE

# Stripe - Clés live (production)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_PUBLIQUE
# STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRETE

# URL de votre application (pour les redirections après paiement)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Développement
# NEXT_PUBLIC_APP_URL=https://votre-domaine.com  # Production
```

## 📦 Étape 3 : Installer les dépendances Stripe

Les dépendances sont déjà installées dans le projet :
- `stripe` (côté serveur)
- `@stripe/stripe-js` (côté client)

Si ce n'est pas le cas, installez-les :

```bash
npm install stripe @stripe/stripe-js
```

## 🗄️ Étape 4 : Créer les tables de base de données

Exécutez le script SQL pour créer les tables nécessaires :

```sql
-- Fichier : supabase/CREATE_CART_AND_ORDERS_TABLES.sql
```

Ce script crée :
- `cart_items` : Panier des utilisateurs
- `orders` : Commandes
- `order_items` : Items des commandes

## ✅ Étape 5 : Tester le paiement

1. **Mode test** : Utilisez les cartes de test Stripe :
   - Carte valide : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future (ex: `12/34`)
   - CVC : n'importe quel 3 chiffres (ex: `123`)
   - Code postal : n'importe quel code postal

2. **Tester le flux complet** :
   - Ajoutez des items au panier
   - Cliquez sur "Passer au paiement"
   - Vous serez redirigé vers Stripe Checkout
   - Utilisez une carte de test
   - Après le paiement, vous serez redirigé vers la page de succès

## 🔄 Étape 6 : Webhooks (Optionnel - pour la production)

Pour gérer les événements Stripe en temps réel (paiements réussis, échecs, etc.), configurez les webhooks :

1. Dans le Dashboard Stripe, allez dans **Developers** > **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL : `https://votre-domaine.com/api/stripe/webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## 🚀 Passage en production

1. **Activer le mode live** :
   - Obtenez vos clés **live** dans le Dashboard Stripe
   - Remplacez les clés de test dans `.env.local`
   - Changez `NEXT_PUBLIC_APP_URL` vers votre domaine de production

2. **Vérifier les paramètres** :
   - Les webhooks pointent vers votre URL de production
   - Les URLs de redirection (`success_url`, `cancel_url`) sont correctes

## 📝 Notes importantes

- **Sécurité** : Ne jamais exposer `STRIPE_SECRET_KEY` côté client
- **Test vs Live** : Toujours tester en mode test avant de passer en production
- **Logs** : Vérifiez les logs Stripe dans le Dashboard pour déboguer
- **Support** : Documentation Stripe : https://stripe.com/docs

## 🐛 Dépannage

### Erreur : "Stripe n'est pas disponible"
- Vérifiez que `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est défini
- Vérifiez que la clé commence par `pk_test_` ou `pk_live_`

### Erreur : "Invalid API Key"
- Vérifiez que `STRIPE_SECRET_KEY` est correct
- Assurez-vous d'utiliser la bonne clé (test vs live)

### Le paiement fonctionne mais l'accès n'est pas accordé
- Vérifiez que la page `/dashboard/catalogue/checkout/success` existe
- Vérifiez les logs du serveur pour voir si les accès sont créés









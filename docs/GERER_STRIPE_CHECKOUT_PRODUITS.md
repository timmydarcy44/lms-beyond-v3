# Gérer les URLs Stripe Checkout pour chaque produit

## 📋 Système flexible

Vous n'avez **PAS besoin** de configurer manuellement chaque produit dans le code. Le système utilise maintenant un champ dans la base de données pour stocker l'URL Stripe Checkout de chaque produit.

## 🔧 Configuration

### 1. Ajouter l'URL Stripe Checkout à un produit

#### Option A : Via SQL (directement dans Supabase)

1. **Aller dans Supabase Dashboard** > **SQL Editor**
2. **Exécuter cette requête** pour ajouter l'URL à un produit :

```sql
-- Trouver le catalog_item par titre
SELECT id, title, stripe_checkout_url 
FROM catalog_items 
WHERE title ILIKE '%pourquoi les enfants se mettent%';

-- Mettre à jour avec l'URL Stripe Checkout
UPDATE catalog_items 
SET stripe_checkout_url = 'https://buy.stripe.com/dRmdRaeay8Ni8Sg8bh33W01'
WHERE title ILIKE '%pourquoi les enfants se mettent%';
```

#### Option B : Via l'interface Super Admin (à venir)

Une interface sera ajoutée dans le dashboard Super Admin pour gérer les URLs Stripe Checkout directement.

### 2. Pour chaque nouveau produit

1. **Créer la page Stripe Checkout** sur Stripe
2. **Copier l'URL** (ex: `https://buy.stripe.com/...`)
3. **Ajouter l'URL dans la base de données** :

```sql
UPDATE catalog_items 
SET stripe_checkout_url = 'https://buy.stripe.com/VOTRE_URL'
WHERE id = 'ID_DU_CATALOG_ITEM';
```

## 🔄 Comment ça fonctionne

1. **L'utilisateur clique sur un produit**
   - Le système vérifie si le produit a une `stripe_checkout_url`
   - Si oui et que l'utilisateur n'a pas accès, redirection vers cette URL
   - Sinon, utilisation du système de paiement intégré

2. **L'utilisateur paie sur Stripe**
   - Stripe envoie un webhook `checkout.session.completed`
   - Le webhook trouve le produit par l'URL Stripe Checkout
   - L'accès est accordé automatiquement

3. **L'utilisateur peut accéder au contenu**
   - L'accès est enregistré dans `catalog_item_access`
   - L'utilisateur peut maintenant voir le contenu

## 📝 Exemple : Ajouter une URL à un produit

### Pour "Pourquoi les enfants se mettent il en colère ?"

Un script SQL est disponible : `supabase/ADD_STRIPE_CHECKOUT_TO_RESOURCE.sql`

Exécutez-le dans Supabase SQL Editor pour configurer automatiquement cette ressource.

### Pour d'autres produits

```sql
-- 1. Trouver le produit
SELECT id, title, price 
FROM catalog_items 
WHERE title ILIKE '%nom du produit%';

-- 2. Mettre à jour avec l'URL Stripe
UPDATE catalog_items 
SET stripe_checkout_url = 'https://buy.stripe.com/VOTRE_URL_ICI'
WHERE id = 'ID_TROUVE_ETAPE_1';
```

### Script rapide pour plusieurs produits

```sql
-- Exemple : Ajouter des URLs à plusieurs produits en une fois
UPDATE catalog_items 
SET stripe_checkout_url = 'https://buy.stripe.com/URL_PRODUIT_1'
WHERE title ILIKE '%titre produit 1%';

UPDATE catalog_items 
SET stripe_checkout_url = 'https://buy.stripe.com/URL_PRODUIT_2'
WHERE title ILIKE '%titre produit 2%';
```

## 🎯 Avantages

- ✅ **Pas besoin de modifier le code** pour chaque produit
- ✅ **Configuration simple** via SQL ou interface
- ✅ **Flexible** : chaque produit peut avoir sa propre URL
- ✅ **Automatique** : l'accès est accordé après paiement

## ⚠️ Notes importantes

- **Email requis** : L'utilisateur doit utiliser le même email que son compte
- **Webhook configuré** : Assurez-vous que le webhook Stripe est configuré (voir `STRIPE_CHECKOUT_SETUP.md`)
- **URL unique** : Chaque URL Stripe Checkout doit être unique par produit

## 🔍 Vérifier la configuration

```sql
-- Voir tous les produits avec une URL Stripe Checkout
SELECT id, title, price, stripe_checkout_url 
FROM catalog_items 
WHERE stripe_checkout_url IS NOT NULL;
```


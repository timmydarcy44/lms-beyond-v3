# Configuration Stripe Checkout pour "Pourquoi les enfants se mettent il en colère ?"

## 📋 Configuration

### 1. Configuration du Webhook Stripe

Pour que l'accès au contenu soit automatiquement accordé après paiement, vous devez configurer un webhook Stripe :

1. **Aller dans le Dashboard Stripe**
   - Connectez-vous à [dashboard.stripe.com](https://dashboard.stripe.com)
   - Allez dans **Developers** > **Webhooks**

2. **Créer un nouveau webhook**
   - Cliquez sur **Add endpoint**
   - URL du webhook : `https://votre-domaine.com/api/stripe/webhook`
   - Événements à écouter :
     - `checkout.session.completed` ✅

3. **Récupérer le secret du webhook**
   - Après création, copiez le **Signing secret**
   - Ajoutez-le dans vos variables d'environnement :
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

### 2. Configuration dans Stripe Checkout

Dans votre page Stripe Checkout (`https://buy.stripe.com/dRmdRaeay8Ni8Sg8bh33W01`), configurez :

1. **URL de succès**
   - Ajoutez une URL de redirection après paiement
   - Exemple : `https://jessicacontentin.fr/ressources?payment=success`

2. **Métadonnées (optionnel)**
   - Si possible, ajoutez des métadonnées à la session :
     - `itemId` : ID du catalog_item
     - `itemType` : "ressource"
     - `userId` : ID de l'utilisateur (si disponible)

### 3. Comment ça fonctionne

1. **L'utilisateur clique sur la ressource**
   - Si c'est "Pourquoi les enfants se mettent il en colère ?" et qu'il n'a pas accès
   - Il est redirigé vers `https://buy.stripe.com/dRmdRaeay8Ni8Sg8bh33W01`

2. **L'utilisateur paie sur Stripe**
   - Stripe traite le paiement
   - Stripe envoie un événement `checkout.session.completed` au webhook

3. **Le webhook accorde l'accès**
   - Le webhook reçoit l'événement
   - Il trouve l'utilisateur par email
   - Il trouve la ressource par titre
   - Il accorde l'accès dans `catalog_item_access`

4. **L'utilisateur peut accéder au contenu**
   - L'utilisateur est redirigé vers le site
   - Il peut maintenant accéder à la ressource

## 🔍 Dépannage

### Le webhook ne fonctionne pas

1. **Vérifier les logs**
   - Allez dans **Developers** > **Webhooks** > Votre webhook > **Logs**
   - Vérifiez les erreurs

2. **Vérifier la signature**
   - Le `STRIPE_WEBHOOK_SECRET` doit correspondre au secret du webhook
   - Vérifiez dans vos variables d'environnement

3. **Tester le webhook**
   - Utilisez Stripe CLI pour tester localement :
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```

### L'accès n'est pas accordé

1. **Vérifier l'email**
   - L'email utilisé pour le paiement doit correspondre à un compte dans Supabase
   - Vérifiez dans la table `profiles`

2. **Vérifier le titre de la ressource**
   - Le titre doit contenir "pourquoi les enfants se mettent" ou "colère"
   - Vérifiez dans la table `resources`

3. **Vérifier les logs**
   - Consultez les logs du serveur pour voir les erreurs
   - Vérifiez dans Supabase si l'accès a été créé dans `catalog_item_access`

## 📝 Notes importantes

- **Email requis** : L'utilisateur doit utiliser le même email que son compte sur le site
- **Titre de la ressource** : Le système détecte la ressource par son titre, assurez-vous qu'il est correct
- **Sécurité** : Le webhook vérifie la signature Stripe pour s'assurer que la requête vient bien de Stripe
- **Idempotence** : Le système utilise `upsert` pour éviter les doublons

## 🧪 Tester

1. **Créer un compte de test**
   - Créez un compte sur le site avec un email de test

2. **Tester le paiement**
   - Cliquez sur la ressource "Pourquoi les enfants se mettent il en colère ?"
   - Vous devriez être redirigé vers Stripe Checkout
   - Utilisez une carte de test Stripe : `4242 4242 4242 4242`

3. **Vérifier l'accès**
   - Après paiement, vérifiez dans Supabase que l'accès a été créé
   - Vérifiez que vous pouvez accéder à la ressource



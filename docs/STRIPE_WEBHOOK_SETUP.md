# Configuration du Webhook Stripe

## ⚠️ IMPORTANT : Configuration requise pour que les achats fonctionnent automatiquement

Le webhook Stripe doit être configuré dans le dashboard Stripe pour que les achats soient automatiquement traités.

## Configuration dans Stripe Dashboard

1. **Accéder au Dashboard Stripe** : https://dashboard.stripe.com/webhooks
2. **Créer un nouveau webhook** (ou modifier l'existant)
3. **URL du webhook** : 
   - Production : `https://www.jessicacontentin.fr/api/stripe/webhook`
   - Développement : `https://votre-domaine-vercel.vercel.app/api/stripe/webhook`
4. **Événements à écouter** :
   - `checkout.session.completed` ✅ (OBLIGATOIRE)
5. **Récupérer le secret du webhook** :
   - Après la création, Stripe affiche un "Signing secret" (commence par `whsec_`)
   - Copier ce secret
6. **Configurer la variable d'environnement** :
   - Dans Vercel : Variables d'environnement → `STRIPE_WEBHOOK_SECRET`
   - Valeur : Le secret récupéré (ex: `whsec_xxxxxxxxxxxxx`)

## Vérification

### 1. Vérifier que le webhook est configuré

Dans Stripe Dashboard → Webhooks, vous devriez voir :
- ✅ Statut : "Enabled"
- ✅ URL : `https://www.jessicacontentin.fr/api/stripe/webhook`
- ✅ Événements : `checkout.session.completed`

### 2. Tester le webhook

1. Effectuer un achat de test
2. Vérifier dans Stripe Dashboard → Webhooks → [Votre webhook] → "Recent events"
3. Vérifier les logs Vercel pour voir les logs du webhook :
   - `[stripe/webhook] Processing payment for email: ...`
   - `[stripe/webhook] ✅ Access granted successfully for item: ...`

### 3. Vérifier les logs en cas d'erreur

Les logs du webhook incluent :
- ✅ Succès : `[stripe/webhook] ✅ Access granted successfully`
- ❌ Erreurs : `[stripe/webhook] ❌ Error granting access: ...`

## Fonctionnement automatique

Le webhook fait automatiquement :
1. ✅ Détecte le paiement réussi
2. ✅ Trouve l'utilisateur par email (ou le crée automatiquement si nouveau)
3. ✅ Accorde l'accès au produit dans `catalog_access`
4. ✅ Envoie l'email de confirmation d'achat

## Dépannage

### Le webhook n'est pas appelé
- Vérifier que l'URL est correcte dans Stripe Dashboard
- Vérifier que le webhook est "Enabled"
- Vérifier que l'événement `checkout.session.completed` est sélectionné

### Le webhook échoue
- Vérifier les logs Vercel pour voir l'erreur exacte
- Vérifier que `STRIPE_WEBHOOK_SECRET` est correctement configuré
- Vérifier que les métadonnées sont bien passées lors de la création de la session

### L'accès n'est pas accordé
- Vérifier les logs du webhook dans Vercel
- Vérifier que `catalog_item_id` est bien dans les métadonnées
- Utiliser l'API route `/api/admin/grant-access-manually` pour accorder manuellement l'accès

## API Route de secours

Si le webhook échoue, vous pouvez accorder manuellement l'accès via :

```bash
POST /api/admin/grant-access-manually
{
  "session_id": "cs_test_xxxxx",
  // OU
  "user_email": "email@example.com",
  "catalog_item_id": "uuid-du-catalog-item"
}
```

**Note** : Cette route nécessite d'être super admin.


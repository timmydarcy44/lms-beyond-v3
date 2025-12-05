# 📧 Liste des Templates d'Emails - Jessica Contentin

**Date:** 3 décembre 2025  
**Site:** jessicacontentin.fr

---

## 📋 RÉSUMÉ

Jessica Contentin utilise **4 templates d'emails** principaux pour communiquer avec ses utilisateurs :

1. ✅ **Email de confirmation d'inscription** - Envoyé lors de la création d'un compte
2. ✅ **Email d'accès à une ressource** - Envoyé quand Jessica assigne manuellement une ressource
3. ✅ **Email de confirmation d'achat** - Envoyé après un paiement Stripe réussi
4. ⚠️ **Email de bienvenue** - Template disponible mais non utilisé actuellement

---

## 1. 📝 EMAIL DE CONFIRMATION D'INSCRIPTION

### Informations
- **Fichier:** `src/lib/emails/templates.ts` (fonction `getSignupConfirmationEmail()`)
- **Fonction d'envoi:** `sendSignupConfirmationEmail()` dans `src/lib/emails/send.ts`
- **API Route:** `/api/emails/send-signup-confirmation`
- **Quand:** Lors de la création d'un compte sur `/jessica-contentin/inscription`

### Paramètres
- `email` (string) - Email de l'utilisateur
- `firstName` (string | null) - Prénom de l'utilisateur (optionnel)
- `confirmationLink` (string) - Lien de confirmation du compte
- `loginLink` (string) - Lien de connexion

### Sujet
- **Sujet:** "Confirmez votre adresse email - Jessica CONTENTIN"

### Contenu
- Message de bienvenue personnalisé avec prénom
- Lien de confirmation avec bouton CTA "Confirmer mon email"
- Lien de secours si le bouton ne fonctionne pas
- Astuce pour vérifier le dossier spam
- Footer avec lien de connexion et copyright

### Design
- **Couleurs:** ✅ Jessica Contentin (#C6A664, #8B6F47, #F8F5F0, #2F2A25)
- **Style:** Template personnalisé avec branding Jessica Contentin
- **Branding:** ✅ "Jessica CONTENTIN" dans le header
- **Sous-titre:** "Psychopédagogue certifiée en neuroéducation"

### Utilisation
```typescript
// Dans src/app/jessica-contentin/inscription/page.tsx
await fetch("/api/emails/send-signup-confirmation", {
  method: "POST",
  body: JSON.stringify({
    email: values.email,
    firstName: values.firstName,
    confirmationLink: confirmationLink,
  }),
});
```

### Tags Brevo
- `["signup", "confirmation"]`

---

## 2. 🎁 EMAIL D'ACCÈS À UNE RESSOURCE

### Informations
- **Fichier:** `src/lib/emails/templates/resource-access.ts`
- **Fonction:** `getResourceAccessEmail()`
- **Fonction d'envoi:** `sendResourceAccessEmail()` dans `src/lib/emails/send-resource-access.ts`
- **API Route:** `/api/admin/assign-resource`
- **Quand:** Quand Jessica assigne manuellement une ressource à un utilisateur depuis le super admin

### Paramètres
- `email` (string) - Email de l'utilisateur
- `firstName` (string | null) - Prénom de l'utilisateur (optionnel)
- `resourceTitle` (string) - Titre de la ressource assignée
- `resourceUrl` (string) - URL d'accès à la ressource

### Sujet
- **Sujet:** "Jessica vous a ouvert un accès"

### Contenu
- Salutation personnalisée avec prénom
- Annonce de l'ouverture d'accès
- Titre de la ressource dans un encadré
- Bouton CTA "Accéder à la ressource"
- Lien de secours
- Lien de connexion si pas de compte
- Signature de Jessica CONTENTIN

### Design
- **Couleurs:** Jessica Contentin (#C6A664, #8B6F47, #F8F5F0, #2F2A25)
- **Style:** Template personnalisé avec branding Jessica Contentin
- **Branding:** "Jessica CONTENTIN" dans le header ✅

### Utilisation
```typescript
// Dans src/app/api/admin/assign-resource/route.ts
await sendResourceAccessEmail(
  userEmail,
  firstName,
  catalogItem.title,
  resourceUrl
);
```

### Tags Brevo
- `["resource-access", "manual-grant"]`

---

## 3. 💳 EMAIL DE CONFIRMATION D'ACHAT

### Informations
- **Fichier:** `src/lib/emails/templates.ts` (fonction `getPurchaseConfirmationEmail()`)
- **Fonction d'envoi:** `sendPurchaseConfirmationEmail()` dans `src/lib/emails/send.ts`
- **API Route:** `/api/stripe/webhook` (appelé automatiquement après paiement)
- **Quand:** Après un paiement Stripe réussi pour un achat de ressource/test/module

### Paramètres
- `email` (string) - Email de l'utilisateur
- `firstName` (string | null) - Prénom de l'utilisateur (optionnel)
- `resourceTitle` (string) - Titre du contenu acheté
- `resourcePrice` (number) - Prix payé en euros
- `purchaseDate` (string) - Date d'achat (optionnel, par défaut date actuelle)

### Sujet
- **Sujet:** Défini dans le template (à vérifier)

### Contenu
- Confirmation de l'achat
- Détails de l'achat (titre, prix, date)
- Lien d'accès au contenu
- Informations de facturation
- Signature de Jessica CONTENTIN

### Design
- **Couleurs:** ✅ Jessica Contentin (#C6A664, #8B6F47, #F8F5F0, #2F2A25)
- **Style:** Template personnalisé avec branding Jessica Contentin
- **Branding:** ✅ "Jessica CONTENTIN" dans le header
- **Sous-titre:** "Psychopédagogue certifiée en neuroéducation"

### Utilisation
```typescript
// Dans src/app/api/stripe/webhook/route.ts
await sendPurchaseConfirmationEmail(
  customerEmail,
  firstName,
  catalogItem.title,
  catalogItem.price || 0
);
```

### Tags Brevo
- `["purchase", "confirmation"]`

---

## 4. 👋 EMAIL DE BIENVENUE

### Informations
- **Fichier:** `src/lib/emails/templates.ts` (fonction `getWelcomeEmail()`)
- **Fonction d'envoi:** `sendWelcomeEmail()` dans `src/lib/emails/send.ts`
- **API Route:** Aucune route API dédiée
- **Quand:** ⚠️ **NON UTILISÉ ACTUELLEMENT** - Template disponible mais pas appelé

### Paramètres
- `email` (string) - Email de l'utilisateur
- `firstName` (string | null) - Prénom de l'utilisateur (optionnel)
- `loginLink` (string) - Lien de connexion

### Sujet
- **Sujet:** Défini dans le template (à vérifier)

### Contenu
- Message de bienvenue
- Informations sur le compte
- Lien de connexion
- Signature de Jessica CONTENTIN

### Design
- **Couleurs:** ✅ Jessica Contentin (#C6A664, #8B6F47, #F8F5F0, #2F2A25)
- **Style:** Template personnalisé avec branding Jessica Contentin
- **Branding:** ✅ "Jessica CONTENTIN" dans le header
- **Sous-titre:** "Psychopédagogue certifiée en neuroéducation"

### Utilisation
⚠️ **NON UTILISÉ** - Pourrait être envoyé après confirmation d'email

### Tags Brevo
- `["welcome"]`

---

## 5. 🔐 EMAIL DE RÉINITIALISATION DE MOT DE PASSE

### Informations
- **Fichier:** `src/lib/emails/templates.ts` (fonction `getPasswordResetEmail()`)
- **Fonction d'envoi:** `sendPasswordResetEmail()` dans `src/lib/emails/send.ts`
- **API Route:** `/api/emails/send-password-reset`
- **Quand:** ⚠️ **À VÉRIFIER** - Lors de la demande de réinitialisation de mot de passe

### Paramètres
- `email` (string) - Email de l'utilisateur
- `firstName` (string | null) - Prénom de l'utilisateur (optionnel)
- `resetLink` (string) - Lien de réinitialisation

### Sujet
- **Sujet:** Défini dans le template (à vérifier)

### Contenu
- Message de réinitialisation
- Lien de réinitialisation
- Instructions
- Signature de Jessica CONTENTIN

### Design
- **Couleurs:** ✅ Jessica Contentin (#C6A664, #8B6F47, #F8F5F0, #2F2A25)
- **Style:** Template personnalisé avec branding Jessica Contentin
- **Branding:** ✅ "Jessica CONTENTIN" dans le header
- **Sous-titre:** "Psychopédagogue certifiée en neuroéducation"

### Utilisation
⚠️ **À VÉRIFIER** - Doit être testé

### Tags Brevo
- `["password-reset"]`

---

## 📊 RÉSUMÉ DES TEMPLATES

| # | Template | Statut | Utilisé | Branding | Priorité |
|---|----------|--------|---------|----------|----------|
| 1 | Confirmation d'inscription | ✅ | ✅ | ✅ Jessica Contentin | ✅ OK |
| 2 | Accès à une ressource | ✅ | ✅ | ✅ Jessica Contentin | ✅ OK |
| 3 | Confirmation d'achat | ✅ | ✅ | ✅ Jessica Contentin | ✅ OK |
| 4 | Bienvenue | ✅ | ❌ | ✅ Jessica Contentin | 🟢 Optionnel |
| 5 | Réinitialisation MDP | ✅ | ⚠️ | ✅ Jessica Contentin | 🟡 À tester |

---

## ⚠️ ACTIONS REQUISES

### 🟡 PRIORITÉ MOYENNE

1. **Tester le template de réinitialisation de mot de passe**
   - Vérifier qu'il est bien appelé lors de la demande de réinitialisation
   - Tester le workflow complet (demande → email → réinitialisation)
   - Vérifier que le lien fonctionne correctement

2. **Tester tous les emails en production**
   - Confirmation d'inscription
   - Accès à une ressource
   - Confirmation d'achat
   - Réinitialisation de mot de passe

### 🟢 PRIORITÉ BASSE

4. **Activer l'email de bienvenue** (optionnel)
   - Décider si on veut l'envoyer après confirmation d'email
   - Vérifier le branding
   - Implémenter l'envoi si nécessaire

---

## 📝 NOTES

- Tous les emails sont envoyés via **Brevo** (ex-Sendinblue)
- L'expéditeur par défaut est **"Jessica CONTENTIN"** avec l'email `contentin.cabinet@gmail.com`
- Les emails arrivent actuellement en **spam** - Configuration SPF/DKIM/DMARC requise
- Les templates utilisent des **tags Brevo** pour le tracking et la catégorisation

---

## 🔗 FICHIERS CONCERNÉS

- `src/lib/emails/brevo.ts` - Configuration Brevo et fonction d'envoi
- `src/lib/emails/send.ts` - Fonctions d'envoi des emails
- `src/lib/emails/send-resource-access.ts` - Fonction d'envoi d'accès ressource
- `src/lib/emails/templates/resource-access.ts` - Template accès ressource
- `src/lib/emails/templates.ts` - Templates généraux (inscription, achat, bienvenue, reset MDP)
- `src/lib/emails/templates/signup-confirmation.ts` - ⚠️ Ancien template Beyond Connect (non utilisé pour Jessica)
- `src/app/api/emails/send-signup-confirmation/route.ts` - API route inscription
- `src/app/api/admin/assign-resource/route.ts` - API route assignation ressource
- `src/app/api/stripe/webhook/route.ts` - Webhook Stripe (confirmation achat)


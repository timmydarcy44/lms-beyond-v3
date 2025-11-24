# Configuration BREVO pour les emails

## 1. Obtenir la clé API BREVO

1. Connectez-vous à votre compte BREVO (https://app.brevo.com)
2. Allez dans **Settings** → **API Keys**
3. Créez une nouvelle clé API ou utilisez une clé existante
4. Copiez la clé API (format: `xkeysib-...`)

## 2. Configuration des variables d'environnement

Ajoutez la clé API BREVO dans vos variables d'environnement :

### `.env.local` (développement local)
```env
BREVO_API_KEY=xkeysib-votre-cle-api-ici
```

### Vercel (production)
1. Allez dans votre projet Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez :
   - **Name**: `BREVO_API_KEY`
   - **Value**: Votre clé API BREVO
   - **Environment**: Production, Preview, Development

## 3. Configuration de l'expéditeur

Par défaut, les emails sont envoyés depuis :
- **Email**: `noreply@jessicacontentin.fr`
- **Nom**: `Jessica CONTENTIN`
- **Reply-To**: `contact@jessicacontentin.fr`

Pour modifier ces valeurs, éditez `src/lib/emails/brevo.ts`.

## 4. Types d'emails configurés

### Email de confirmation d'inscription
- **Quand**: Lors de la création d'un compte
- **Template**: `getSignupConfirmationEmail()`
- **Objet**: "Confirmez votre adresse email - Jessica CONTENTIN"
- **Contenu**: Lien de confirmation d'email avec redirection vers la page ressources après confirmation

### Email de bienvenue
- **Quand**: Après confirmation de l'email
- **Template**: `getWelcomeEmail()`
- **Objet**: "Bienvenue sur Jessica CONTENTIN"
- **Contenu**: Message de bienvenue et lien vers les ressources

### Email de confirmation d'achat
- **Quand**: Après un paiement Stripe réussi
- **Template**: `getPurchaseConfirmationEmail()`
- **Objet**: "Confirmation de votre achat - [Titre de la ressource]"
- **Contenu**: Détails de l'achat et lien vers les ressources

### Email de réinitialisation de mot de passe
- **Quand**: Lors d'une demande de réinitialisation de mot de passe
- **Template**: `getPasswordResetEmail()`
- **Objet**: "Réinitialisation de votre mot de passe - Jessica CONTENTIN"
- **Contenu**: Lien de réinitialisation valable 1 heure

## 5. Utilisation

### Envoyer un email de confirmation d'inscription

```typescript
import { sendSignupConfirmationEmail } from "@/lib/emails/send";

await sendSignupConfirmationEmail(
  "user@example.com",
  "Prénom",
  "https://www.jessicacontentin.fr/auth/confirm?token=..."
);
```

### Envoyer un email de confirmation d'achat

```typescript
import { sendPurchaseConfirmationEmail } from "@/lib/emails/send";

await sendPurchaseConfirmationEmail(
  "user@example.com",
  "Prénom",
  "Titre de la ressource",
  29.99
);
```

## 6. Intégration automatique

Les emails sont automatiquement envoyés :
- **Inscription**: Supabase Auth envoie automatiquement l'email de confirmation (configuré pour utiliser BREVO via SMTP dans Supabase)
- **Achat**: Automatiquement via le webhook Stripe `/api/stripe/webhook` après un paiement réussi
- **Réinitialisation de mot de passe**: Via l'API route `/api/emails/send-password-reset` (appelée depuis la page `/jessica-contentin/forgot-password`)

## 6.1. Configuration Supabase pour utiliser BREVO SMTP

Pour que Supabase utilise BREVO pour envoyer les emails d'inscription :

1. Allez dans votre projet Supabase
2. **Settings** → **Auth** → **SMTP Settings**
3. Configurez :
   - **Enable Custom SMTP**: ✅ Activé
   - **Sender email**: `noreply@jessicacontentin.fr`
   - **Sender name**: `Jessica CONTENTIN`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Username**: Votre email BREVO (celui utilisé pour créer le compte)
   - **Password**: Votre clé SMTP BREVO (différente de l'API key, trouvable dans Settings → SMTP & API → SMTP)
   - **Secure**: ✅ Activé (TLS)

**Note**: Pour les emails de confirmation d'inscription, Supabase utilisera BREVO via SMTP. Pour les autres emails (achat, reset password), ils sont envoyés directement via l'API BREVO.

## 7. Personnalisation des templates

Les templates HTML sont dans `src/lib/emails/templates.ts`. Vous pouvez les modifier pour personnaliser :
- Les couleurs (actuellement : #C6A664 pour le doré, #2F2A25 pour le texte)
- Le contenu
- La structure HTML

## 8. Test

Pour tester l'envoi d'emails :

1. Vérifiez que `BREVO_API_KEY` est bien configurée
2. Créez un compte de test
3. Vérifiez votre boîte email (et les spams)
4. Consultez les logs BREVO dans le dashboard pour voir les emails envoyés

## 9. Limites BREVO

- **Plan gratuit**: 300 emails/jour
- **Plan Lite**: 10 000 emails/mois
- Vérifiez votre plan dans le dashboard BREVO

## 10. Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez que `BREVO_API_KEY` est bien configurée
2. Vérifiez les logs dans la console (erreurs `[BREVO]`)
3. Vérifiez le dashboard BREVO pour voir les emails bloqués
4. Vérifiez que l'email de l'expéditeur est vérifié dans BREVO

### Erreur "API key not configured"

- Vérifiez que `BREVO_API_KEY` est dans `.env.local` (local) ou dans Vercel (production)
- Redémarrez le serveur de développement après avoir ajouté la variable

### Les emails arrivent en spam

- Vérifiez que le domaine `jessicacontentin.fr` est vérifié dans BREVO
- Configurez SPF, DKIM et DMARC pour votre domaine
- Contactez le support BREVO pour vérifier la configuration


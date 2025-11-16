# Guide de configuration de l'envoi d'emails

## Vue d'ensemble

Le système d'envoi d'emails utilise **Resend**, un service d'email moderne et fiable. Les emails sont envoyés automatiquement lors des notifications de santé mentale aux coaches et responsables.

## Configuration

### 1. Créer un compte Resend

1. Allez sur https://resend.com
2. Créez un compte gratuit (100 emails/jour en gratuit)
3. Vérifiez votre domaine ou utilisez le domaine de test fourni

### 2. Obtenir votre clé API

1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom à votre clé (ex: "Beyond LMS Production")
4. Copiez la clé API (elle commence par `re_`)

### 3. Configurer les variables d'environnement

#### Option A : Fichier `.env.local` (développement local)

Créez ou modifiez `.env.local` à la racine du projet :

```env
# Resend Email Configuration
RESEND_API_KEY=re_votre_cle_api_ici
RESEND_FROM_EMAIL=noreply@votre-domaine.com

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Pour la production**, utilisez :
```env
RESEND_FROM_EMAIL=noreply@beyond-lms.com
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

#### Option B : Vercel (production)

1. Allez sur https://vercel.com
2. Sélectionnez votre projet
3. Allez dans **Settings → Environment Variables**
4. Ajoutez les variables suivantes :

   **Variable 1 :**
   - **Name** : `RESEND_API_KEY`
   - **Value** : `re_votre_cle_api_ici`
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
   - Cliquez sur **Save**

   **Variable 2 :**
   - **Name** : `RESEND_FROM_EMAIL`
   - **Value** : `noreply@votre-domaine.com`
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
   - Cliquez sur **Save**

   **Variable 3 :**
   - **Name** : `NEXT_PUBLIC_APP_URL`
   - **Value** : `https://votre-domaine.com`
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
   - Cliquez sur **Save**

### 4. Installer le package Resend

```bash
npm install resend
```

## Vérification du domaine d'envoi

### Option A : Utiliser le domaine de test Resend

Par défaut, Resend fournit un domaine de test : `onboarding@resend.dev`

Vous pouvez l'utiliser pour tester, mais il est limité et les emails peuvent aller en spam.

### Option B : Vérifier votre propre domaine (recommandé pour production)

1. Dans Resend Dashboard, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `beyond-lms.com`)
4. Ajoutez les enregistrements DNS fournis par Resend dans votre registrar
5. Attendez la vérification (peut prendre quelques minutes)

Une fois vérifié, vous pouvez utiliser `noreply@votre-domaine.com` comme adresse d'envoi.

## Utilisation

### Envoi automatique lors des alertes de santé mentale

Lorsqu'un admin clique sur "Notifier le coach" dans le dashboard de santé mentale :

1. **Notification in-app** : Une tâche est créée dans `todo_tasks` pour le coach
2. **Email automatique** : Un email est envoyé au coach avec :
   - Nom et email de l'apprenant
   - Score de santé mentale
   - Niveau (Préoccupant, Critique, etc.)
   - Message personnalisé
   - Lien vers le tableau de bord

### Format de l'email

L'email contient :
- En-tête avec logo/gradient
- Informations de l'apprenant (nom, email, score, niveau)
- Message personnalisé
- Recommandations d'action
- Lien vers le tableau de bord

## Test de l'envoi d'email

### Test manuel via API

Vous pouvez tester l'envoi d'email en appelant l'API :

```bash
curl -X POST http://localhost:3000/api/mental-health/notify-coach \
  -H "Content-Type: application/json" \
  -d '{
    "learner_id": "uuid-de-l-apprenant",
    "message": "Message de test",
    "notification_type": "coach"
  }'
```

### Vérifier les logs

Les logs d'envoi d'email apparaissent dans la console :
- Succès : `[email/resend] Email sent successfully`
- Erreur : `[email/resend] Error sending email: ...`

## Dépannage

### L'email n'est pas envoyé

1. **Vérifier la clé API** :
   - Assurez-vous que `RESEND_API_KEY` est bien configurée
   - Vérifiez qu'elle commence par `re_`
   - Redémarrez le serveur après modification

2. **Vérifier le domaine d'envoi** :
   - Si vous utilisez votre propre domaine, assurez-vous qu'il est vérifié
   - Utilisez `onboarding@resend.dev` pour tester

3. **Vérifier les logs** :
   - Consultez la console pour voir les erreurs
   - Vérifiez les logs Resend dans le dashboard

### Les emails vont en spam

1. **Vérifier votre domaine** : Utilisez un domaine vérifié plutôt que le domaine de test
2. **Configurer SPF/DKIM** : Resend fournit les enregistrements DNS nécessaires
3. **Éviter les mots déclencheurs** : Évitez les mots comme "URGENT", "ALERTE" en majuscules dans le sujet

### Alternative : Utiliser un autre service d'email

Si vous préférez utiliser un autre service (SendGrid, Mailgun, etc.), vous pouvez modifier `src/lib/email/resend-client.ts` pour utiliser votre service préféré.

## Coûts

- **Resend Free** : 100 emails/jour, 3 000 emails/mois
- **Resend Pro** : À partir de $20/mois pour 50 000 emails

Pour la plupart des cas d'usage, le plan gratuit est suffisant.

## Sécurité

- ⚠️ **Ne commitez JAMAIS** `RESEND_API_KEY` dans Git
- ✅ Utilisez des variables d'environnement
- ✅ Limitez l'accès à la clé API dans Resend Dashboard
- ✅ Utilisez des domaines vérifiés pour éviter le spam



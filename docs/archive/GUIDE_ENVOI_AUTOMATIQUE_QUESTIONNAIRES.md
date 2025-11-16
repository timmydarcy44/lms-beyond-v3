# Guide d'envoi automatique des questionnaires de santé mentale

## Vue d'ensemble

Le système d'envoi automatique des questionnaires de santé mentale permet d'envoyer des questionnaires aux apprenants selon une fréquence configurée (hebdomadaire, bi-hebdomadaire, mensuel). Les apprenants reçoivent un **email automatique** avec un lien vers le questionnaire.

## Configuration

### 1. Exécuter les scripts SQL

Exécutez les scripts SQL suivants dans l'ordre :

1. `CREATE_MENTAL_HEALTH_QUESTIONNAIRES_TABLE.sql`
2. `CREATE_MENTAL_HEALTH_QUESTIONS_TABLE.sql`
3. `CREATE_MENTAL_HEALTH_RESPONSES_TABLE.sql`
4. `CREATE_MENTAL_HEALTH_INDICATORS_TABLE.sql`
5. `CREATE_MENTAL_HEALTH_AUTO_SEND_FUNCTION.sql`

### 2. Configuration de l'envoi d'emails

Le système utilise **Resend** pour envoyer des emails automatiquement. Voir `GUIDE_CONFIGURATION_EMAIL.md` pour la configuration complète.

**Variables d'environnement requises :**
- `RESEND_API_KEY` : Votre clé API Resend (commence par `re_`)
- `RESEND_FROM_EMAIL` : Adresse d'envoi (ex: `noreply@votre-domaine.com`)
- `NEXT_PUBLIC_APP_URL` : URL de votre application (ex: `https://beyond-lms.com`)

**Installation :**
```bash
npm install resend
```

### 3. Configuration du cron job

#### Option A : Vercel Cron (Recommandé si vous utilisez Vercel)

Créez un fichier `vercel.json` à la racine du projet :

```json
{
  "crons": [
    {
      "path": "/api/mental-health/send-questionnaire-reminders",
      "schedule": "0 18 * * 5"
    }
  ]
}
```

Cela enverra automatiquement les emails chaque vendredi à 18h UTC.

#### Option B : Supabase Edge Function

Créez une Edge Function Supabase qui appelle l'API Next.js :

```typescript
// supabase/functions/send-mental-health-questionnaires/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://votre-domaine.com";
  
  // Appeler l'API Next.js pour envoyer les emails
  const response = await fetch(`${appUrl}/api/mental-health/send-questionnaire-reminders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify({ error: data.error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Déployez la fonction :
```bash
supabase functions deploy send-mental-health-questionnaires
```

Configurez un cron job dans Supabase Dashboard :
- **Nom** : `send-mental-health-questionnaires`
- **Schedule** : `0 18 * * 5` (Tous les vendredis à 18h)
- **Function** : `send-mental-health-questionnaires`

#### Option C : Cron job externe (GitHub Actions, etc.)

**Via GitHub Actions :**

Créez `.github/workflows/send-questionnaires.yml` :

```yaml
name: Send Mental Health Questionnaires

on:
  schedule:
    - cron: '0 18 * * 5'  # Tous les vendredis à 18h UTC
  workflow_dispatch:  # Permet de déclencher manuellement

jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Send Questionnaires
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/mental-health/send-questionnaire-reminders \
            -H "Content-Type: application/json"
```

**Via curl manuel :**

```bash
curl -X POST https://votre-domaine.com/api/mental-health/send-questionnaire-reminders \
  -H "Content-Type: application/json"
```

### 4. Création d'un questionnaire

1. Accédez à `/super/premium/sante-mentale`
2. Cliquez sur "Créer un questionnaire"
3. Configurez :
   - **Titre** : Nom du questionnaire
   - **Fréquence** : Hebdomadaire, Bi-hebdomadaire, Mensuel
   - **Jour d'envoi** : Jour de la semaine (0 = Dimanche, 5 = Vendredi)
   - **Heure d'envoi** : Heure d'envoi (ex: 18:00)
   - **Rôles cibles** : Rôles qui recevront le questionnaire (ex: ["learner"])

4. Ajoutez des questions avec logique conditionnelle si nécessaire

### 5. Notification des utilisateurs

Lorsqu'un questionnaire est envoyé automatiquement :

1. **Email automatique** : Un email est envoyé à chaque apprenant avec :
   - Un lien direct vers le questionnaire
   - Le titre du questionnaire
   - Un message personnalisé
   
2. **Notification in-app** : Une notification est créée dans `mental_health_notifications` pour tracker l'envoi et éviter les doublons

3. **Tâche dans la todo list** : Optionnel, peut être ajoutée pour rappeler à l'utilisateur de répondre

**API pour envoyer les rappels :**
- `POST /api/mental-health/send-questionnaire-reminders`
- Peut être appelée manuellement ou par un cron job
- Envoie automatiquement les emails aux apprenants pour les questionnaires actifs du jour
- Évite les envois en double (vérifie si un email a déjà été envoyé aujourd'hui)

### 6. Calcul des indicateurs

Après qu'un utilisateur ait répondu à un questionnaire, les indicateurs sont automatiquement calculés et enregistrés dans la table `mental_health_indicators`.

Le calcul se fait via l'API `/api/mental-health/calculate-score` qui est appelée automatiquement lors de la soumission des réponses.

## Accès aux résultats

Les résultats sont accessibles selon les rôles :

- **Apprenants** : `/dashboard/apprenant/sante-mentale` - Voient leur propre évolution avec score et interprétation
- **Formateurs** : `/dashboard/formateur/sante-mentale` - Voient les réponses de leurs apprenants avec graphiques
- **Admins** : `/super/premium/sante-mentale` - Voient toutes les réponses de leur organisation avec statistiques agrégées (ex: "56% de vos étudiants se sentent bien")
- **Super Admins** : `/super/premium/sante-mentale` - Voient toutes les réponses
- **Utilisateurs spéciaux** (comme `contentin.cabinet@gmail.com`) : Accès via RLS policy

## Notifications aux coaches

Lorsqu'un apprenant a un score préoccupant, les admins peuvent notifier les coaches :

1. **Notification in-app** : Une tâche est créée dans `todo_tasks` pour le coach
2. **Email automatique** : Un email est envoyé au coach avec :
   - Nom et email de l'apprenant
   - Score de santé mentale
   - Niveau (Préoccupant, Critique, etc.)
   - Message personnalisé
   - Lien vers le tableau de bord

## Notes importantes

- Les questionnaires sont envoyés automatiquement selon leur configuration (jour et heure)
- La table `mental_health_notifications` permet de tracker les envois et d'éviter les doublons
- Les indicateurs sont calculés automatiquement après chaque réponse pour suivre l'évolution
- La logique conditionnelle permet d'adapter les questions selon les réponses précédentes (théorie des jeux)
- Les emails sont envoyés via Resend (voir `GUIDE_CONFIGURATION_EMAIL.md` pour la configuration)

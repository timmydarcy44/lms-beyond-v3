# Dépannage Brevo - Emails ne partent pas

## Problème actuel
Erreur 401 "Key not found" lors de l'envoi d'emails via l'API Brevo.

## Solutions à vérifier

### 1. Vérifier le type de clé API

Il existe **deux types de clés** dans Brevo :
- **Clé API générale** (commence par `xkeysib-`) : Pour l'API REST
- **Clé SMTP** (commence par `xsmtpsib-`) : Pour l'envoi SMTP uniquement

**Pour l'API REST (ce que nous utilisons), il faut une clé API générale, pas une clé SMTP.**

### 2. Créer/Obtenir la bonne clé API

1. Connectez-vous à Brevo : https://app.brevo.com
2. Allez dans **Settings** → **API Keys** (ou **SMTP & API** → **API Keys**)
3. Créez une **nouvelle clé API** (pas SMTP)
4. Donnez-lui un nom (ex: "Beyond Connect API")
5. Sélectionnez les permissions : **Send emails** (ou toutes les permissions)
6. Copiez la clé (elle doit commencer par `xkeysib-`)

### 3. Vérifier l'email sender

L'email `contentin.cabinet@gmail.com` doit être **vérifié** dans Brevo :

1. Allez dans **Settings** → **Senders & IP**
2. Vérifiez que `contentin.cabinet@gmail.com` est dans la liste
3. Si ce n'est pas le cas, ajoutez-le et vérifiez-le (vous recevrez un email de vérification)

### 4. Mettre à jour la clé dans .env.local

Une fois que vous avez la bonne clé API (qui commence par `xkeysib-`), mettez à jour `.env.local` :

```env
BREVO_API_KEY=xkeysib-votre-nouvelle-cle-ici
```

### 5. Redémarrer le serveur

Après avoir mis à jour la clé, redémarrez le serveur :
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### 6. Tester l'envoi

Utilisez le script de test :
```bash
node scripts/test-brevo-email.js
```

## Différence entre clé API et clé SMTP

- **Clé API (`xkeysib-...`)** : Utilisée pour l'API REST de Brevo (ce que nous utilisons)
- **Clé SMTP (`xsmtpsib-...`)** : Utilisée uniquement pour l'envoi SMTP (utilisée par Supabase Auth)

Pour notre application, nous avons besoin de la **clé API** (`xkeysib-...`), pas de la clé SMTP.

## Vérification rapide

La clé que vous avez fournie commence par `xsmtpsib-`, ce qui indique que c'est une clé SMTP, pas une clé API.

**Action requise** : Obtenez une clé API (qui commence par `xkeysib-`) depuis le dashboard Brevo.


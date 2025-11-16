# Configuration Google Cloud Vision API pour Beyond Note

## 📋 État actuel

✅ **Code implémenté** :
- Client Google Vision créé (`src/lib/ai/google-vision-client.ts`)
- Intégration dans l'API d'upload (`src/app/api/beyond-note/upload/route.ts`)
- Support pour les images (JPEG, PNG, etc.)
- Support pour les PDFs (via `documentTextDetection`)

## 🔧 Configuration requise

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez le **Project ID**

### 2. Activer l'API Cloud Vision

1. Dans la console Google Cloud, allez dans **APIs & Services** > **Library**
2. Recherchez "Cloud Vision API"
3. Cliquez sur **Enable**

### 3. Créer un compte de service

1. Allez dans **IAM & Admin** > **Service Accounts**
2. Cliquez sur **Create Service Account**
3. Donnez un nom (ex: `beyond-note-vision`)
4. Cliquez sur **Create and Continue**
5. Attribuez le rôle **Cloud Vision API User**
6. Cliquez sur **Done**

### 4. Générer une clé JSON

1. Cliquez sur le compte de service créé
2. Allez dans l'onglet **Keys**
3. Cliquez sur **Add Key** > **Create new key**
4. Sélectionnez **JSON**
5. Téléchargez le fichier JSON

### 5. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Option 1 : JSON inline** (recommandé pour Vercel)
- Copiez tout le contenu du fichier JSON téléchargé
- Collez-le dans `GOOGLE_CLOUD_CREDENTIALS` (sur une seule ligne)

**Option 2 : Chemin de fichier** (pour développement local)
- Placez le fichier JSON dans un dossier sécurisé (ex: `./credentials/google-vision.json`)
- Ajoutez `GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-vision.json` à `.env.local`
- Dans ce cas, vous n'avez pas besoin de `GOOGLE_CLOUD_CREDENTIALS`

### 6. Configuration Vercel

Si vous déployez sur Vercel :

1. Allez dans votre projet Vercel > **Settings** > **Environment Variables**
2. Ajoutez :
   - `GOOGLE_CLOUD_PROJECT_ID` = votre project ID
   - `GOOGLE_CLOUD_CREDENTIALS` = le JSON complet (sur une seule ligne)

## 🧪 Test

Une fois configuré, testez en uploadant :
- Une image avec du texte (JPEG, PNG)
- Un PDF scanné (image)

Le texte devrait être extrait automatiquement.

## 💰 Coûts

Google Cloud Vision API :
- **1 000 premières unités/mois** : Gratuit
- **Au-delà** : ~$1.50 pour 1 000 images (premières 1 000 unités)
- **PDFs** : 1 page = 1 unité

Voir [la page de tarification](https://cloud.google.com/vision/pricing) pour plus de détails.

## 🔍 Dépannage

### Erreur : "Google Cloud credentials not configured"
- Vérifiez que `GOOGLE_CLOUD_PROJECT_ID` et `GOOGLE_CLOUD_CREDENTIALS` sont définis
- Vérifiez que le JSON est valide (pas de retours à la ligne dans la variable d'environnement)

### Erreur : "Permission denied"
- Vérifiez que le compte de service a le rôle **Cloud Vision API User**
- Vérifiez que l'API Cloud Vision est activée

### Pas de texte extrait
- Vérifiez les logs serveur pour voir les erreurs détaillées
- Assurez-vous que l'image/PDF contient du texte lisible
- Pour les PDFs très complexes, l'extraction peut échouer




# Configuration de la clé API Anthropic

## Problème
Si vous recevez l'erreur "L'IA n'a pas pu générer de structure. Vérifiez votre clé API Anthropic", cela signifie que la clé API Anthropic n'est pas configurée ou n'est pas accessible.

## Solution

### 1. Obtenir une clé API Anthropic
1. Allez sur https://console.anthropic.com/
2. Créez un compte ou connectez-vous
3. Allez dans "API Keys"
4. Créez une nouvelle clé API
5. Copiez la clé (elle commence généralement par `sk-ant-...`)

### 2. Ajouter la clé dans votre fichier .env.local

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
ANTHROPIC_API_KEY=sk-ant-votre-cle-api-ici
```

### 3. Redémarrer le serveur de développement

Après avoir ajouté la clé, redémarrez votre serveur Next.js :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez-le
npm run dev
```

### 4. Vérifier la configuration

Vous pouvez vérifier que la clé est bien chargée en regardant les logs du serveur. Si vous voyez :
- `[ai] ANTHROPIC_API_KEY not configured` → La clé n'est pas chargée
- `[ai] Calling Anthropic API for JSON generation` → La clé est chargée et l'appel est en cours

## Notes importantes

- Ne commitez JAMAIS votre fichier `.env.local` dans Git
- Le fichier `.env.local` est déjà dans `.gitignore`
- Si vous travaillez en équipe, chaque développeur doit créer sa propre clé API
- Pour la production, ajoutez la clé dans les variables d'environnement de votre plateforme (Vercel, etc.)

## Test

Une fois la clé configurée, essayez de générer une structure de formation depuis un référentiel. Si tout fonctionne, vous devriez voir dans les logs :
- `[api/generate-course-structure] Calling Anthropic with prompt length: XXX`
- `[ai] Calling Anthropic API for JSON generation`
- `[ai] Successfully parsed JSON from Anthropic`





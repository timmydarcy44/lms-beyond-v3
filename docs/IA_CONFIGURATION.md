# Configuration de l'IA pour la Génération de Questions Miroirs

## 🎯 Objectif

Ce guide vous explique comment configurer l'IA (OpenAI ou Anthropic) pour générer automatiquement des questions miroirs dans les tests de soft skills.

## 🔑 Configuration des Clés API

### Option 1 : OpenAI (Recommandé)

1. **Obtenir une clé API OpenAI :**
   - Allez sur https://platform.openai.com/api-keys
   - Connectez-vous ou créez un compte
   - Cliquez sur "Create new secret key"
   - Copiez la clé (elle ne sera affichée qu'une seule fois)

2. **Ajouter la clé dans `.env.local` :**
   ```env
   OPENAI_API_KEY=sk-...
   ```

3. **Modèle utilisé :** `gpt-4o-mini` (rapide et économique)

### Option 2 : Anthropic (Claude)

1. **Obtenir une clé API Anthropic :**
   - Allez sur https://console.anthropic.com/
   - Connectez-vous ou créez un compte
   - Allez dans "API Keys"
   - Cliquez sur "Create Key"
   - Copiez la clé

2. **Ajouter la clé dans `.env.local` :**
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **Modèle utilisé :** `claude-3-5-sonnet-20241022`

### Priorité

- Si les deux clés sont présentes, **OpenAI est utilisé en priorité**
- Si aucune clé n'est configurée, le système utilise un **fallback basique** (génération sans IA)

## 📝 Fichier `.env.local`

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
# OpenAI (Option 1 - Recommandé)
OPENAI_API_KEY=sk-votre-cle-ici

# OU Anthropic (Option 2)
ANTHROPIC_API_KEY=sk-ant-votre-cle-ici

# Autres variables d'environnement existantes
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## ✅ Vérification

1. **Redémarrez le serveur de développement** après avoir ajouté les clés :
   ```bash
   npm run dev
   ```

2. **Testez la génération :**
   - Créez une question dans le builder de tests
   - Cliquez sur "Générer une question miroir avec l'IA"
   - Si l'IA est configurée, vous verrez une question miroir générée avec un niveau de confiance élevé (>0.8)
   - Si l'IA n'est pas configurée, vous verrez "Génération basique (IA non configurée)" avec une confiance de 0.6

## 🔒 Sécurité

- **Ne commitez JAMAIS** le fichier `.env.local` dans Git
- Le fichier `.env.local` est déjà dans `.gitignore`
- Les clés API sont des secrets sensibles, gardez-les privées

## 💰 Coûts

### OpenAI (gpt-4o-mini)
- **Input :** ~$0.15 par million de tokens
- **Output :** ~$0.60 par million de tokens
- **Coût estimé par question miroir :** ~$0.0001 (très économique)

### Anthropic (claude-3-5-sonnet)
- **Input :** ~$3.00 par million de tokens
- **Output :** ~$15.00 par million de tokens
- **Coût estimé par question miroir :** ~$0.001 (légèrement plus cher)

## 🐛 Dépannage

### L'IA ne fonctionne pas

1. **Vérifiez que la clé est bien dans `.env.local`**
2. **Redémarrez le serveur** après modification
3. **Vérifiez les logs** dans la console du serveur
4. **Testez avec curl** (remplacez `YOUR_KEY`) :
   ```bash
   # Pour OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   
   # Pour Anthropic
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "Content-Type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
   ```

### Erreur "API key invalid"

- Vérifiez que vous avez copié la clé complète
- Vérifiez qu'il n'y a pas d'espaces avant/après la clé
- Pour OpenAI, assurez-vous d'avoir des crédits sur votre compte
- Pour Anthropic, vérifiez que votre compte est actif

## 📚 Ressources

- [Documentation OpenAI](https://platform.openai.com/docs)
- [Documentation Anthropic](https://docs.anthropic.com/)
- [Guide des prix OpenAI](https://openai.com/pricing)
- [Guide des prix Anthropic](https://www.anthropic.com/pricing)




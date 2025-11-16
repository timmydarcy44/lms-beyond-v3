# Debug de la Configuration IA

## 🔍 Vérification Rapide

Si l'IA n'est pas détectée malgré la présence des clés dans `.env.local`, suivez ces étapes :

### 1. Vérifier le format du fichier `.env.local`

Le fichier doit être à la **racine du projet** (même niveau que `package.json`) et avoir ce format :

```env
OPENAI_API_KEY=sk-votre-cle-ici
ANTHROPIC_API_KEY=sk-ant-votre-cle-ici
```

**Points importants :**
- ❌ Pas d'espaces avant ou après le `=`
- ❌ Pas de guillemets autour de la clé
- ❌ Pas de commentaires sur la même ligne
- ✅ Une variable par ligne
- ✅ Pas d'accents ou caractères spéciaux dans les noms

### 2. Redémarrer le serveur

**CRUCIAL** : Next.js ne charge les variables d'environnement qu'au démarrage.

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### 3. Vérifier via l'API de test

Ouvrez dans votre navigateur :
```
http://localhost:3000/api/ai/test-config
```

Cela vous montrera :
- Si les clés sont détectées
- Leur longueur
- Si elles commencent par les bons préfixes

### 4. Vérifier les logs du serveur

Dans la console où tourne `npm run dev`, vous devriez voir :
```
[api/ai/check-config] OpenAI key exists: true
[api/ai/check-config] Anthropic key exists: true
```

### 5. Vérifier le format des clés

- **OpenAI** : Doit commencer par `sk-` et faire environ 51 caractères
- **Anthropic** : Doit commencer par `sk-ant-` et faire environ 60 caractères

### 6. Vérifier que le fichier est bien lu

Ajoutez temporairement dans `.env.local` :
```env
TEST_VAR=test123
```

Puis dans votre code, vérifiez :
```typescript
console.log("TEST_VAR:", process.env.TEST_VAR);
```

Si `undefined`, le fichier n'est pas lu.

## 🐛 Problèmes Courants

### Problème : "L'IA n'est pas configurée" malgré les clés

**Solutions :**
1. ✅ Redémarrer le serveur (le plus fréquent)
2. ✅ Vérifier qu'il n'y a pas d'espaces dans `.env.local`
3. ✅ Vérifier que le fichier est à la racine du projet
4. ✅ Vérifier le format des clés (commencent-elles par `sk-` ou `sk-ant-` ?)

### Problème : Les clés sont détectées mais l'IA ne fonctionne pas

**Solutions :**
1. ✅ Vérifier que vous avez des crédits sur votre compte OpenAI/Anthropic
2. ✅ Vérifier que la clé n'a pas expiré
3. ✅ Vérifier les logs du serveur pour les erreurs API
4. ✅ Tester avec curl (voir ci-dessous)

### Problème : Erreur "API key invalid"

**Solutions :**
1. ✅ Vérifier que vous avez copié la clé complète
2. ✅ Vérifier qu'il n'y a pas d'espaces avant/après
3. ✅ Régénérer une nouvelle clé si nécessaire

## 🧪 Test Manuel avec cURL

### Test OpenAI

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer VOTRE_CLE_ICI"
```

Si ça fonctionne, vous verrez une liste de modèles.

### Test Anthropic

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: VOTRE_CLE_ICI" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

Si ça fonctionne, vous verrez une réponse JSON.

## 📝 Checklist de Debug

- [ ] Le fichier `.env.local` existe à la racine du projet
- [ ] Les clés sont au bon format (sans espaces, sans guillemets)
- [ ] Les clés commencent par `sk-` (OpenAI) ou `sk-ant-` (Anthropic)
- [ ] Le serveur a été redémarré après l'ajout des clés
- [ ] L'API `/api/ai/test-config` retourne `exists: true`
- [ ] Les logs du serveur montrent que les clés sont détectées
- [ ] Les clés fonctionnent avec curl

## 🔧 Solution Rapide

Si rien ne fonctionne, essayez ceci :

1. **Supprimez `.env.local`**
2. **Créez un nouveau fichier `.env.local`** avec uniquement :
   ```env
   OPENAI_API_KEY=sk-votre-cle
   ```
3. **Redémarrez le serveur**
4. **Testez à nouveau**

Si ça fonctionne, ajoutez ensuite la clé Anthropic.




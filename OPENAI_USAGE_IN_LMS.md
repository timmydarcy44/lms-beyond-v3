# Utilisation d'OpenAI dans le LMS

## ✅ Endpoints qui utilisent votre crédit OpenAI

Vos 5€ sur OpenAI sont utilisés par les fonctionnalités suivantes :

### 1. **Beyond Note** (Nouveau)
- **`/api/beyond-note/upload`** : OCR avec OpenAI Vision (`gpt-4o`)
  - Extraction de texte depuis les images
  - Extraction de texte depuis les PDFs scannés
- **`/api/beyond-note/ai-action`** : Transformations IA (fallback si Anthropic échoue)
  - Utilise `gpt-4o-mini` en fallback

### 2. **Génération de Questions Miroirs**
- **`/api/ai/generate-mirror-question`** : Priorité OpenAI
  - Utilise `gpt-4o-mini`
  - Fallback sur Anthropic si OpenAI n'est pas disponible

### 3. **Génération de Chapitres**
- **`/api/ai/generate-chapter`** : Utilise OpenAI uniquement
  - Utilise `gpt-4o-mini` via `generateJSON()`

### 4. **Assistant de Leçons**
- **`/api/ai/lesson-assistant`** : Utilise OpenAI uniquement
  - Utilise `gpt-4o-mini` via `generateText()` et `generateJSON()`

### 5. **Génération de Structure de Formation**
- **`/api/courses/generate-structure`** : Utilise OpenAI uniquement
  - Utilise `gpt-4o-mini` via `generateJSON()`
- **`/api/courses/generate-structure-from-pdf`** : Utilise OpenAI
  - Utilise `gpt-4o-mini` via `generateJSON()`

### 6. **Analyse de Résultats de Tests**
- **`/api/tests/analyze-results`** : Fallback OpenAI
  - Utilise `gpt-4o-mini` si Anthropic n'est pas disponible

## 💰 Coûts estimés

### Modèles utilisés :
- **`gpt-4o-mini`** : ~$0.15 / 1M tokens d'entrée, ~$0.60 / 1M tokens de sortie
- **`gpt-4o`** (Vision) : ~$2.50 / 1M tokens d'entrée, ~$10 / 1M tokens de sortie

### Estimation pour 5€ :
- **~33 000 tokens** avec `gpt-4o-mini` (texte)
- **~2 000 tokens** avec `gpt-4o` (Vision/OCR)

## 📊 Recommandations

1. **Beyond Note** utilise `gpt-4o` (Vision) qui est plus cher - surveillez l'usage
2. La plupart des autres fonctionnalités utilisent `gpt-4o-mini` qui est économique
3. Certaines fonctionnalités ont Anthropic en priorité (donc n'utilisent OpenAI qu'en fallback)

## 🔍 Vérifier votre usage

Vous pouvez vérifier votre usage sur : https://platform.openai.com/usage




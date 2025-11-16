# Diagnostic des problèmes IA

## Vérification de la configuration

1. **Vérifier les clés API** :
   - Allez sur : `http://localhost:3000/api/ai/check-config`
   - Vous devriez voir la configuration des clés API

2. **Vérifier les logs** :
   - Ouvrez la console du serveur Next.js
   - Cherchez les erreurs commençant par `[ai]`

## Problèmes courants

### 1. ANTHROPIC_API_KEY manquante ou invalide
- **Symptôme** : Erreur "L'IA n'a pas pu générer de structure"
- **Solution** : Vérifiez que `ANTHROPIC_API_KEY` est dans `.env.local` et redémarrez le serveur

### 2. OPENAI_API_KEY manquante ou invalide
- **Symptôme** : L'assistant de leçon ne fonctionne pas
- **Solution** : Vérifiez que `OPENAI_API_KEY` est dans `.env.local` et redémarrez le serveur

### 3. Erreur de parsing JSON
- **Symptôme** : "Error parsing JSON response"
- **Solution** : L'IA retourne parfois du texte avant/après le JSON. Vérifiez les logs pour voir la réponse complète.

## Routes IA

- `/api/ai/generate-course-structure` - Génération de structure complète (Anthropic)
- `/api/ai/create-chapter` - Création de chapitre (Anthropic)
- `/api/ai/create-subchapter` - Création de sous-chapitre (Anthropic)
- `/api/ai/lesson-assistant` - Assistant intelligent pour leçons (OpenAI)





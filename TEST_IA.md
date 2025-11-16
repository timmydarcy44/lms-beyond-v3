# 🧪 Guide de Test des Fonctionnalités IA

## ✅ Configuration Vérifiée

- ✅ Package `openai` installé
- ✅ `OPENAI_API_KEY` configuré dans `.env.local`

## 🧪 Tests à Effectuer

### Test 1 : Génération de Chapitre (Formateur)

1. Aller sur `/dashboard/formateur/formations/new` ou éditer une formation existante
2. Cliquer sur "Structure & modules"
3. Sélectionner une section existante ou en créer une
4. Cliquer sur "Créer le chapitre avec Beyond AI"
5. Entrer un prompt, ex: "Chapitre sur la gestion du stress en entreprise avec techniques de respiration"
6. Cliquer sur "Générer"
7. **Résultat attendu** : Le chapitre est rempli avec titre, résumé, contenu, durée, type et suggestions de sous-chapitres

### Test 2 : Génération de Flashcards (Formateur)

1. Dans l'éditeur de chapitre, remplir le champ "Contenu" avec au moins 50 caractères
2. Cliquer sur "Créer des flashcards"
3. **Résultat attendu** : Toast de confirmation avec le nombre de flashcards générées

### Test 3 : Transformation de Texte - Reformulation (Apprenant)

1. Aller sur une page de cours (`/catalog/[category]/[slug]/play/[lesson]`)
2. Sélectionner un passage de texte dans le contenu
3. Cliquer sur "Reformuler" dans la toolbar flottante
4. **Résultat attendu** : Modal avec le texte reformulé

### Test 4 : Transformation de Texte - Carte Mentale (Apprenant)

1. Sélectionner un passage de texte
2. Cliquer sur "Créer une map"
3. **Résultat attendu** : Modal avec carte mentale structurée (thème central + branches)

### Test 5 : Transformation de Texte - Traduction (Apprenant)

1. Sélectionner un passage de texte
2. Cliquer sur "Traduire"
3. **Résultat attendu** : Modal avec texte traduit (par défaut en anglais)

### Test 6 : Transformation de Texte - Insights (Apprenant)

1. Sélectionner un passage de texte
2. Cliquer sur "Analyser"
3. **Résultat attendu** : Modal avec concepts clés, exemples, questions de révision

## 🔍 Vérifications à Faire

### Console du Navigateur
- Pas d'erreurs JavaScript
- Les appels API sont bien effectués (`/api/ai/*`)

### Console Serveur
- Pas d'erreurs OpenAI
- Les réponses sont bien parsées

### Erreurs Possibles

**Erreur : "OPENAI_API_KEY not configured"**
- Vérifier que `.env.local` existe et contient `OPENAI_API_KEY=sk-...`
- Redémarrer le serveur de développement (`npm run dev`)

**Erreur : "Non authentifié"**
- Se connecter avec un compte formateur ou apprenant

**Erreur : "Erreur lors de la génération"**
- Vérifier que la clé API est valide
- Vérifier les quotas OpenAI
- Vérifier la console serveur pour les détails

## 📊 Performance

- Génération de chapitre : ~10-20 secondes
- Génération de flashcards : ~5-10 secondes
- Transformation de texte : ~3-8 secondes selon l'action

## 💡 Astuces

- Les prompts plus détaillés donnent de meilleurs résultats
- Pour les flashcards, le contenu du chapitre doit être substantiel (min 50 caractères)
- Les transformations fonctionnent mieux avec des passages de 50-500 caractères





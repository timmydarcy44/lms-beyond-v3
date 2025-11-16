# 📊 État des Fonctionnalités IA sur le Frontend

## ❌ Résumé : Fonctionnalités Non Implémentées

Les interfaces utilisateur (UI) sont présentes, mais **les appels API vers l'IA ne sont pas implémentés**. Toutes les fonctions affichent simplement un toast ou ont des handlers vides.

---

## 1. Côté Formateur - Création de Chapitre avec IA

### État Actuel

**Fichier** : `src/components/formateur/course-builder/course-structure-builder.tsx`

**Boutons présents** :
- ✅ "Créer la formation avec Beyond Learning" (ligne 107)
- ✅ "Créer le chapitre avec Beyond AI" (ligne 500)
- ✅ "Créer des flashcards" (ligne 509)

**Implémentation** : ❌ **VIDE**

```typescript
// Ligne 495-497
onClick={() => {
  /* TODO: déclencher génération AI */
}}

// Ligne 504-506
onClick={() => {
  /* TODO: génération flashcards */
}}
```

**Actions requises** :
1. Créer une route API `/api/ai/generate-chapter` ou `/api/beyond-ai/generate-chapter`
2. Créer une action serveur dans `src/app/api/ai/generate-chapter/route.ts`
3. Connecter le bouton à cette route
4. Afficher un modal de prompt pour le formateur
5. Appeler l'API Beyond AI / ChatGPT avec le prompt
6. Mettre à jour le chapitre avec le contenu généré

---

## 2. Côté Apprenant - Transformation de Texte avec IA

### État Actuel

**Fichier** : `src/components/apprenant/lesson-smart-assist.tsx`

**Composant intégré** : ✅ Oui, dans `lesson-play-view.tsx` (ligne 234)

**Actions disponibles** :
- ✅ "Reformuler" (`rephrase`)
- ✅ "Créer une map" (`mindmap`)
- ✅ "Créer un schéma" (`schema`)
- ✅ "Traduire" (`translate`)
- ✅ "Transformer en audio" (`audio`)
- ✅ "Analyser" (`insights`)

**Implémentation** : ❌ **Seulement un toast**

```typescript
// Ligne 154-169
const handleAction = (actionId: string) => {
  const action = ACTIONS.find((item) => item.id === actionId);
  if (!action || !selectionExcerpt) return;

  toast(
    `${action.label} en préparation`,
    {
      description: "Cette fonctionnalité appellera Beyond AI/ChatGPT pour traiter le passage sélectionné.",
      action: {
        label: "Fermer",
        onClick: () => undefined,
      },
    },
  );
};
```

**Actions requises** :
1. Créer une route API `/api/ai/transform-text` ou `/api/beyond-ai/transform-text`
2. Créer une action serveur dans `src/app/api/ai/transform-text/route.ts`
3. Gérer chaque type de transformation :
   - `rephrase` : Reformuler le texte
   - `mindmap` : Générer une carte mentale (JSON ou image)
   - `schema` : Générer un schéma visuel (diagramme)
   - `translate` : Traduire dans une langue choisie
   - `audio` : Générer un fichier audio (TTS)
   - `insights` : Analyser et extraire insights
4. Afficher les résultats dans un modal ou un panneau latéral
5. Permettre à l'apprenant de copier/utiliser le résultat

---

## 3. Fonctionnalités IA Manquantes - Détails Techniques

### A. Création de Chapitre (Formateur)

**Workflow attendu** :
1. Formateur clique sur "Créer le chapitre avec Beyond AI"
2. Un modal s'ouvre avec :
   - Un champ de prompt (ex: "Chapitre sur la gestion du stress en entreprise")
   - Options de format (vidéo, texte, document)
   - Durée cible
3. Le système envoie le prompt à l'API IA
4. L'IA génère :
   - Titre du chapitre
   - Résumé
   - Contenu (texte markdown)
   - Sous-chapitres suggérés
5. Le formateur peut accepter, modifier ou régénérer

**API nécessaire** :
```typescript
POST /api/ai/generate-chapter
Body: {
  prompt: string;
  courseContext?: string;
  format: "video" | "text" | "document";
  duration?: string;
}
Response: {
  title: string;
  summary: string;
  content: string;
  suggestedSubchapters: Array<{ title: string; duration: string }>;
}
```

### B. Transformation de Texte (Apprenant)

**Workflow attendu** :
1. Apprenant sélectionne un passage de texte
2. Une toolbar flottante apparaît avec les actions IA
3. Apprenant clique sur une action (ex: "Reformuler")
4. Le système envoie le texte sélectionné à l'API IA
5. L'IA traite et retourne le résultat
6. Le résultat s'affiche dans un modal/panneau
7. L'apprenant peut copier, utiliser ou fermer

**API nécessaire** :
```typescript
POST /api/ai/transform-text
Body: {
  text: string;
  action: "rephrase" | "mindmap" | "schema" | "translate" | "audio" | "insights";
  options?: {
    language?: string; // pour translate
    targetLanguage?: string;
    style?: string; // pour rephrase
  };
}
Response: {
  result: string | object; // texte ou JSON selon l'action
  format: "text" | "json" | "image" | "audio";
}
```

---

## 4. Intégration avec Beyond AI / ChatGPT

### Options d'implémentation

**Option 1 : API Beyond AI (si elle existe)**
- Créer un client dans `src/lib/ai/beyond-client.ts`
- Endpoints spécifiques Beyond AI

**Option 2 : OpenAI ChatGPT API**
- Utiliser `@openai/api` ou similaire
- Prompts personnalisés pour chaque action

**Option 3 : Route API Proxy**
- Créer des routes API Next.js qui appellent l'IA
- Centraliser la logique dans `/api/ai/*`

### Structure de fichiers recommandée

```
src/
├── lib/
│   └── ai/
│       ├── beyond-client.ts      # Client Beyond AI
│       ├── openai-client.ts      # Client OpenAI (fallback)
│       ├── prompts/
│       │   ├── chapter-generation.ts
│       │   └── text-transformation.ts
│       └── utils.ts
├── app/
│   └── api/
│       └── ai/
│           ├── generate-chapter/
│           │   └── route.ts
│           └── transform-text/
│               └── route.ts
└── components/
    └── ai/
        ├── chapter-generation-modal.tsx
        └── text-transformation-result.tsx
```

---

## 5. Checklist d'Implémentation

### Phase 1 : Infrastructure
- [ ] Créer le dossier `src/lib/ai/`
- [ ] Créer un client IA (Beyond AI ou OpenAI)
- [ ] Configurer les variables d'environnement (`BEYOND_AI_API_KEY` ou `OPENAI_API_KEY`)
- [ ] Créer les routes API dans `/app/api/ai/`

### Phase 2 : Création de Chapitre (Formateur)
- [ ] Créer `ChapterGenerationModal` component
- [ ] Implémenter `/api/ai/generate-chapter` route
- [ ] Connecter le bouton "Créer le chapitre avec Beyond AI"
- [ ] Gérer le loading et les erreurs
- [ ] Permettre la régénération

### Phase 3 : Transformation de Texte (Apprenant)
- [ ] Implémenter `/api/ai/transform-text` route
- [ ] Créer `TextTransformationResult` component (modal/panneau)
- [ ] Mettre à jour `handleAction` dans `lesson-smart-assist.tsx`
- [ ] Gérer chaque type de transformation
- [ ] Gérer le loading et les erreurs

### Phase 4 : Génération de Flashcards
- [ ] Créer `/api/ai/generate-flashcards` route
- [ ] Connecter le bouton "Créer des flashcards"
- [ ] Générer les flashcards depuis le contenu du chapitre
- [ ] Sauvegarder dans la table `flashcards`

---

## 6. Notes Importantes

1. **Sécurité** : Ne jamais exposer les clés API côté client. Tout doit passer par les routes API serveur.

2. **Rate Limiting** : Implémenter un système de rate limiting pour éviter les abus.

3. **Coûts** : Suivre l'usage de l'API IA (logs, métriques) pour gérer les coûts.

4. **Fallback** : Prévoir un fallback si l'API IA est indisponible (message d'erreur clair).

5. **Expérience Utilisateur** :
   - Afficher un état de chargement pendant la génération
   - Permettre d'annuler une requête en cours
   - Sauvegarder les résultats précédents en cache si possible

---

## Conclusion

**État actuel** : ❌ Les fonctionnalités IA ne sont **PAS implémentées**. Seule l'UI est présente.

**Action requise** : Implémenter les routes API et connecter les boutons/composants existants aux services IA.

**Estimation** : 2-3 jours de développement pour implémenter toutes les fonctionnalités IA.





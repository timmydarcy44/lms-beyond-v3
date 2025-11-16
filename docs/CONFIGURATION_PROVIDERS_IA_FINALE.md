# Configuration finale des providers IA

## Résumé des choix

| Fonctionnalité | Provider | Route/Composant | Statut |
|----------------|----------|-----------------|--------|
| **Questions miroirs** | OpenAI (priorité) + Anthropic (fallback) | `/api/ai/generate-mirror-question` | ✅ Configuré |
| **Analyse résultats tests** | Anthropic uniquement | `/api/tests/analyze-results` | ✅ Mis à jour |
| **Génération chapitres** | OpenAI uniquement | `/api/ai/generate-chapter` | ✅ Déjà configuré |
| **Création chapitres** | Anthropic uniquement | `/api/ai/create-chapter` | ✅ Créé |
| **Création sous-chapitres** | Anthropic uniquement | `/api/ai/create-subchapter` | ✅ Créé |
| **Génération flashcards** | Anthropic uniquement | `/api/ai/generate-flashcards` | ✅ Mis à jour |
| **Transformation texte** | Anthropic uniquement | `/api/ai/transform-text` | ✅ Mis à jour |
| **Feedback tests** | Anthropic uniquement | `/api/ai/generate-test-feedback` | ✅ Mis à jour |
| **Assistant leçons** | OpenAI uniquement | `lesson-smart-assist.tsx` | ⚠️ À vérifier |
| **Atelier IA questions** | OpenAI uniquement | `question-flow-builder.tsx` | ⚠️ À vérifier |
| **Structure formation** | Anthropic uniquement | À créer | ⚠️ À implémenter |

## Détails des implémentations

### 1. Questions miroirs
- **Route**: `/api/ai/generate-mirror-question`
- **Provider**: OpenAI (priorité) + Anthropic (fallback)
- **Fichier**: `src/lib/ai/generate-mirror-question.ts`
- **Statut**: ✅ Déjà configuré correctement

### 2. Analyse résultats tests
- **Route**: `/api/tests/analyze-results`
- **Provider**: Anthropic (priorité) + OpenAI (fallback)
- **Fichier**: `src/app/api/tests/analyze-results/route.ts`
- **Statut**: ✅ Mis à jour pour utiliser Anthropic en priorité

### 3. Génération chapitres
- **Route**: `/api/ai/generate-chapter`
- **Provider**: OpenAI uniquement
- **Fichier**: `src/app/api/ai/generate-chapter/route.ts`
- **Statut**: ✅ Déjà configuré avec OpenAI

### 4. Création chapitres
- **Route**: `/api/ai/create-chapter`
- **Provider**: Anthropic uniquement
- **Fichier**: `src/app/api/ai/create-chapter/route.ts`
- **Statut**: ✅ Nouvelle route créée

### 5. Création sous-chapitres
- **Route**: `/api/ai/create-subchapter`
- **Provider**: Anthropic uniquement
- **Fichier**: `src/app/api/ai/create-subchapter/route.ts`
- **Statut**: ✅ Nouvelle route créée

### 6. Génération flashcards
- **Route**: `/api/ai/generate-flashcards`
- **Provider**: Anthropic uniquement
- **Fichier**: `src/app/api/ai/generate-flashcards/route.ts`
- **Statut**: ✅ Mis à jour pour utiliser Anthropic

### 7. Transformation texte
- **Route**: `/api/ai/transform-text`
- **Provider**: Anthropic uniquement
- **Fichier**: `src/app/api/ai/transform-text/route.ts`
- **Statut**: ✅ Mis à jour pour utiliser Anthropic

### 8. Feedback tests
- **Route**: `/api/ai/generate-test-feedback`
- **Provider**: Anthropic uniquement
- **Fichier**: `src/app/api/ai/generate-test-feedback/route.ts`
- **Statut**: ✅ Mis à jour pour utiliser Anthropic avec prompt enrichi

### 9. Assistant leçons
- **Composant**: `src/components/apprenant/lesson-smart-assist.tsx`
- **Provider**: OpenAI uniquement
- **Utilise**: `/api/ai/transform-text` (qui utilise maintenant Anthropic)
- **Statut**: ⚠️ **CONFLIT** - Le composant utilise `/api/ai/transform-text` qui est maintenant configuré pour Anthropic, mais l'utilisateur veut OpenAI pour l'assistant leçons
- **Action requise**: Créer une route dédiée `/api/ai/lesson-assistant` avec OpenAI

### 10. Atelier IA questions
- **Composant**: `src/components/formateur/tests/question-flow-builder.tsx`
- **Provider**: OpenAI uniquement
- **Statut**: ⚠️ À vérifier si le composant utilise une route API ou génère directement

### 11. Structure formation
- **Provider**: Anthropic uniquement
- **Statut**: ⚠️ À créer - Route `/api/ai/generate-course-structure` à implémenter

## Actions à effectuer

1. ✅ Créer `src/lib/ai/ai-provider-config.ts` - Configuration centralisée
2. ✅ Créer `src/lib/ai/anthropic-client.ts` - Client Anthropic centralisé
3. ✅ Mettre à jour `/api/ai/generate-flashcards` pour Anthropic
4. ✅ Mettre à jour `/api/ai/transform-text` pour Anthropic
5. ✅ Mettre à jour `/api/ai/generate-test-feedback` pour Anthropic
6. ✅ Mettre à jour `/api/tests/analyze-results` pour Anthropic priorité
7. ✅ Créer `/api/ai/create-chapter` pour Anthropic
8. ✅ Créer `/api/ai/create-subchapter` pour Anthropic
9. ⚠️ Créer `/api/ai/lesson-assistant` pour OpenAI (pour résoudre le conflit avec transform-text)
10. ⚠️ Vérifier `question-flow-builder.tsx` et créer route si nécessaire
11. ⚠️ Créer `/api/ai/generate-course-structure` pour Anthropic

## Notes importantes

- **Assistant leçons** : Actuellement utilise `/api/ai/transform-text` qui est maintenant configuré pour Anthropic. Il faut créer une route dédiée pour l'assistant leçons avec OpenAI.
- **Création vs Génération** : 
  - "Génération" = `/api/ai/generate-chapter` (OpenAI) - Utilisé pour suggérer/générer du contenu
  - "Création" = `/api/ai/create-chapter` (Anthropic) - Utilisé pour créer réellement un chapitre
- **Structure formation** : Route à créer pour générer la structure complète d'une formation avec Anthropic.





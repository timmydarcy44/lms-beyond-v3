# Système de Détection de Biais Cognitifs dans les Tests de Soft Skills

## 🎯 Objectif

Détecter et limiter les biais cognitifs (notamment le biais de désirabilité sociale) dans les tests de soft skills en analysant la cohérence des réponses.

## 🔄 Fonctionnement

### 1. **Questions Miroirs (Mirror Questions)**

**Principe :**
- Pour chaque question créée, le système propose automatiquement une question miroir (formulation inverse ou complémentaire)
- Les deux questions mesurent le même trait mais de manière opposée
- Exemple :
  - Question originale : "Je suis à l'aise pour prendre la parole en public"
  - Question miroir : "Je préfère éviter de parler devant un groupe"

**Génération automatique :**
- Lors de la création d'une question, l'IA analyse le texte
- L'IA génère automatiquement une question miroir avec :
  - Formulation inverse
  - Options inversées (si applicable)
  - Même catégorie et poids

**Système de notation :**
- Les deux questions sont liées par un `mirror_question_id`
- Les réponses sont comparées pour calculer un score de cohérence
- Si les réponses sont incohérentes (ex: "Tout à fait d'accord" sur les deux), cela indique un biais

### 2. **Échelles de Likert Inversées**

**Principe :**
- Pour les questions Likert, certaines sont formulées positivement, d'autres négativement
- Exemple :
  - Positive : "Je gère bien le stress" (1=Pas du tout, 5=Tout à fait)
  - Négative : "Le stress me paralyse" (1=Tout à fait, 5=Pas du tout)

**Détection :**
- Le système marque automatiquement les questions comme "positive" ou "négative"
- Les réponses sont normalisées avant comparaison

### 3. **Calcul de Cohérence**

**Score de cohérence (0-100) :**
- Compare les réponses aux questions miroirs
- Compare les réponses aux questions Likert inversées
- Détecte les patterns suspects :
  - Réponses systématiquement "socialement désirables"
  - Incohérences flagrantes
  - Profils "trop parfaits"

**Formule :**
```
Cohérence = 100 - (Incohérences détectées / Total de paires × 100)
```

### 4. **Intégration IA**

**Génération de questions miroirs :**
- Utilise OpenAI GPT-4 ou Claude pour générer des questions miroirs pertinentes
- Analyse le contexte et la catégorie de la question
- Propose des formulations inverses naturelles

**Analyse des résultats :**
- L'IA analyse les patterns de réponses
- Détecte les biais cognitifs
- Génère un rapport de cohérence avec recommandations

## 📊 Structure de Données

### Question avec Miroir

```typescript
{
  id: "q1",
  title: "Je suis à l'aise pour prendre la parole en public",
  type: "likert",
  category: "Communication",
  mirror_question_id: "q1-mirror", // ID de la question miroir
  is_positive: true, // Formulation positive
  // ...
}

{
  id: "q1-mirror",
  title: "Je préfère éviter de parler devant un groupe",
  type: "likert",
  category: "Communication",
  mirror_question_id: "q1", // Référence à la question originale
  is_positive: false, // Formulation négative
  // ...
}
```

### Score de Cohérence

```typescript
{
  test_attempt_id: "attempt-123",
  consistency_score: 85, // 0-100
  inconsistencies: [
    {
      question_pair: ["q1", "q1-mirror"],
      expected_consistency: "high",
      actual_consistency: "low",
      reason: "Réponses contradictoires sur la même compétence"
    }
  ],
  bias_indicators: [
    {
      type: "social_desirability",
      severity: "medium",
      description: "Tendance à répondre de manière socialement acceptable"
    }
  ]
}
```

## 🚀 Workflow Utilisateur

1. **Création d'une question :**
   - L'utilisateur rédige une question
   - Le système détecte automatiquement si c'est une question de soft skills
   - L'IA propose une question miroir
   - L'utilisateur peut accepter, modifier ou refuser

2. **Configuration :**
   - L'utilisateur peut activer/désactiver la détection de biais
   - Choisir le niveau de sévérité (strict, modéré, souple)
   - Configurer les seuils de cohérence

3. **Passage du test :**
   - Le test est passé normalement
   - Les réponses sont enregistrées

4. **Analyse :**
   - Calcul automatique du score de cohérence
   - Détection des biais
   - Génération d'un rapport par l'IA

5. **Résultats :**
   - Affichage du score de cohérence
   - Alertes si biais détectés
   - Recommandations pour améliorer la fiabilité

## 🎨 Interface Utilisateur

### Dans le Builder de Questions

- **Badge "Question miroir disponible"** : Indique qu'une question miroir peut être générée
- **Bouton "Générer question miroir"** : Lance la génération IA
- **Prévisualisation** : Affiche la question miroir proposée
- **Actions** : Accepter, Modifier, Refuser

### Dans les Résultats

- **Score de cohérence** : Affiché en pourcentage avec code couleur
- **Alertes** : Si biais détectés, affichage d'une alerte
- **Rapport détaillé** : Section dédiée avec analyse IA

## 🔧 Implémentation Technique

### 1. Extension du Type Question

```typescript
export type TestBuilderQuestion = {
  // ... champs existants
  mirror_question_id?: string; // ID de la question miroir
  is_positive?: boolean; // Pour Likert inversées
  bias_detection_enabled?: boolean; // Activer la détection
};
```

### 2. API de Génération IA

```typescript
POST /api/ai/generate-mirror-question
{
  question: "Je suis à l'aise pour prendre la parole en public",
  category: "Communication",
  type: "likert"
}

Response:
{
  mirror_question: "Je préfère éviter de parler devant un groupe",
  options: [...], // Options inversées si applicable
  confidence: 0.95
}
```

### 3. Calcul de Cohérence

```typescript
function calculateConsistency(
  answers: Record<string, any>,
  questions: TestBuilderQuestion[]
): ConsistencyScore {
  // Logique de calcul
}
```

## 📈 Métriques

- **Taux de cohérence moyen** : Moyenne des scores de cohérence
- **Taux de biais détectés** : Pourcentage de tests avec biais
- **Types de biais les plus fréquents** : Statistiques par type




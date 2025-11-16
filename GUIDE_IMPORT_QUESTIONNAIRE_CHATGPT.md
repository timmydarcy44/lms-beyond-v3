# Guide d'import de questionnaire depuis ChatGPT

## Vue d'ensemble

Vous pouvez créer un questionnaire sur ChatGPT et l'importer directement dans Beyond LMS en copiant-collant le JSON généré. Cela permet de gagner du temps et d'utiliser l'IA pour créer des questionnaires complexes avec logique conditionnelle et scoring.

## Format JSON attendu

### Structure de base

```json
{
  "title": "Titre du questionnaire",
  "description": "Description optionnelle",
  "questions": [
    {
      "question_text": "Texte de la question",
      "question_type": "single_choice" | "multiple_choice" | "likert" | "text" | "number",
      "is_required": true,
      "options": [
        {
          "label": "Option 1",
          "value": "opt1",
          "points": 10
        }
      ],
      "conditional_logic": {
        "depends_on": "q-1",
        "conditions": [
          {
            "value": "stress_match",
            "show": true,
            "follow_up_questions": [
              {
                "question_text": "Question de suivi pour le stress lié au match",
                "question_type": "single_choice",
                "options": [...]
              }
            ]
          }
        ]
      },
      "scoring": {
        "enabled": true,
        "points": { "opt1": 10, "opt2": 5 },
        "weight": 1
      }
    }
  ],
  "scoring_config": {
    "enabled": true,
    "max_score": 100,
    "categories": [
      {
        "name": "Bien-être général",
        "questions": ["q-1", "q-2"],
        "weight": 1
      }
    ]
  }
}
```

## Exemple de prompt pour ChatGPT

### Prompt simple

```
Crée un questionnaire JSON de santé mentale pour des joueurs de football avec :
- 5 questions sur le stress, l'anxiété et le bien-être
- Questions à choix unique avec scoring (0-10 points par option)
- Logique conditionnelle : si un joueur dit être stressé par le match de demain, poser des questions de suivi sur la préparation
- Si stressé par la vie personnelle, poser des questions de suivi différentes
- Configuration de scoring avec catégories
```

### Prompt avancé avec logique conditionnelle

```
Crée un questionnaire JSON de santé mentale avec logique conditionnelle avancée :

Question 1 : "Êtes-vous stressé actuellement ?"
- Options : "Non" (0 points), "Oui, par le match" (5 points), "Oui, par la vie perso" (5 points), "Oui, les deux" (8 points)

Si réponse = "Oui, par le match" :
  Question de suivi : "Qu'est-ce qui vous stresse le plus concernant le match ?"
  - Options avec points
  
Si réponse = "Oui, par la vie perso" :
  Question de suivi : "Quel aspect de votre vie personnelle vous préoccupe ?"
  - Options avec points

Si réponse = "Oui, les deux" :
  Poser les deux questions de suivi

Configuration de scoring :
- Score max : 100
- Catégorie "Stress match" : questions liées au match
- Catégorie "Stress personnel" : questions liées à la vie perso
```

## Types de questions supportées

### 1. Choix unique (`single_choice`)

```json
{
  "question_text": "Comment vous sentez-vous ?",
  "question_type": "single_choice",
  "options": [
    { "label": "Très bien", "value": "very_good", "points": 10 },
    { "label": "Bien", "value": "good", "points": 7 },
    { "label": "Moyen", "value": "average", "points": 4 },
    { "label": "Mal", "value": "bad", "points": 1 }
  ]
}
```

### 2. Choix multiple (`multiple_choice`)

```json
{
  "question_text": "Quels sont vos sources de stress ?",
  "question_type": "multiple_choice",
  "options": [
    { "label": "Le match", "value": "match", "points": 3 },
    { "label": "La famille", "value": "family", "points": 2 },
    { "label": "Le travail", "value": "work", "points": 2 }
  ]
}
```

### 3. Échelle de Likert (`likert`)

```json
{
  "question_text": "À quel point vous sentez-vous confiant ?",
  "question_type": "likert",
  "likert_scale": {
    "min": 1,
    "max": 5,
    "labels": {
      "1": "Pas du tout",
      "2": "Un peu",
      "3": "Modérément",
      "4": "Beaucoup",
      "5": "Tout à fait"
    }
  },
  "scoring": {
    "enabled": true,
    "points": { "1": 0, "2": 2, "3": 5, "4": 8, "5": 10 }
  }
}
```

### 4. Réponse libre (`text`)

```json
{
  "question_text": "Y a-t-il autre chose que vous souhaitez partager ?",
  "question_type": "text"
}
```

### 5. Nombre (`number`)

```json
{
  "question_text": "Sur une échelle de 0 à 10, comment évaluez-vous votre niveau de stress ?",
  "question_type": "number",
  "scoring": {
    "enabled": true,
    "points": { "0": 10, "5": 5, "10": 0 }
  }
}
```

## Logique conditionnelle avancée

### Exemple : Stress par match vs vie perso

```json
{
  "question_text": "Êtes-vous stressé actuellement ?",
  "question_type": "single_choice",
  "options": [
    { "label": "Non", "value": "no", "points": 10 },
    { "label": "Oui, par le match", "value": "stress_match", "points": 5 },
    { "label": "Oui, par la vie perso", "value": "stress_perso", "points": 5 },
    { "label": "Oui, les deux", "value": "stress_both", "points": 2 }
  ]
},
{
  "question_text": "Question de suivi match",
  "question_type": "single_choice",
  "conditional_logic": {
    "depends_on": "q-1",
    "conditions": [
      {
        "value": "stress_match",
        "show": true,
        "follow_up_questions": [
          {
            "question_text": "Qu'est-ce qui vous stresse le plus concernant le match ?",
            "question_type": "single_choice",
            "options": [
              { "label": "La performance", "value": "performance", "points": 3 },
              { "label": "La pression", "value": "pressure", "points": 4 },
              { "label": "Les attentes", "value": "expectations", "points": 5 }
            ]
          }
        ]
      },
      {
        "value": "stress_perso",
        "show": true,
        "follow_up_questions": [
          {
            "question_text": "Quel aspect de votre vie personnelle vous préoccupe ?",
            "question_type": "single_choice",
            "options": [
              { "label": "La famille", "value": "family", "points": 3 },
              { "label": "Les finances", "value": "finance", "points": 4 },
              { "label": "La santé", "value": "health", "points": 5 }
            ]
          }
        ]
      }
    ]
  }
}
```

## Configuration du scoring

### Scoring simple

```json
{
  "scoring_config": {
    "enabled": true,
    "max_score": 100
  }
}
```

### Scoring par catégories

```json
{
  "scoring_config": {
    "enabled": true,
    "max_score": 100,
    "categories": [
      {
        "name": "Bien-être général",
        "questions": ["q-1", "q-2", "q-3"],
        "weight": 1
      },
      {
        "name": "Stress lié au match",
        "questions": ["q-4", "q-5"],
        "weight": 1.5
      },
      {
        "name": "Stress personnel",
        "questions": ["q-6", "q-7"],
        "weight": 1.5
      }
    ]
  }
}
```

## Utilisation dans Beyond LMS

1. **Créer le questionnaire sur ChatGPT**
   - Utilisez un des prompts fournis ci-dessus
   - Demandez à ChatGPT de générer le JSON au format exact

2. **Copier le JSON**
   - Copiez le JSON généré par ChatGPT
   - Vérifiez qu'il est valide (pas de texte avant/après)

3. **Importer dans Beyond LMS**
   - Allez sur `/super/premium/sante-mentale/questionnaires/new`
   - Cliquez sur l'onglet "Importer depuis JSON"
   - Collez le JSON dans le champ
   - Cliquez sur "Valider le JSON"
   - Si valide, cliquez sur "Importer le questionnaire"

4. **Ajuster si nécessaire**
   - Une fois importé, vous pouvez modifier les questions dans l'onglet "Créer manuellement"
   - Ajustez les points, la logique conditionnelle, etc.

5. **Sauvegarder**
   - Remplissez les informations générales (fréquence, jour d'envoi, etc.)
   - Cliquez sur "Sauvegarder le questionnaire"

## Résultats et interprétation

### Pour l'apprenant

- **Score global** : Affiché en pourcentage avec interprétation (Excellent, Bien, Modéré, Préoccupant, Critique)
- **Scores par catégorie** : Si configuré, affichage des scores par domaine
- **Recommandations** : Suggestions automatiques basées sur le score

### Pour l'admin

- **Statistiques agrégées** :
  - Nombre total d'apprenants
  - Taux de réponse
  - Score moyen
  - Distribution des scores (graphique en camembert)
  - Pourcentage d'apprenants en bonne santé (ex: "56% de vos étudiants se sentent bien")
- **Alertes** : Liste des apprenants nécessitant une attention
- **Notifications** : Possibilité de notifier automatiquement les coaches/responsables de performance

## Exemple complet

Voir le fichier `EXAMPLE_QUESTIONNAIRE_JSON.json` pour un exemple complet avec toutes les fonctionnalités.




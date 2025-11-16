/**
 * Système de calcul de scores pour les questionnaires de santé mentale
 */

export type ScoringConfig = {
  enabled: boolean;
  max_score?: number;
  categories?: Array<{
    name: string;
    questions: string[];
    weight: number;
  }>;
};

export type QuestionScoring = {
  enabled: boolean;
  points?: Record<string, number>;
  weight?: number;
};

export type ResponseData = {
  question_id: string;
  response_value: any;
  response_data?: any;
};

/**
 * Calcule le score total d'un questionnaire basé sur les réponses
 */
export function calculateQuestionnaireScore(
  responses: ResponseData[],
  questions: Array<{
    id: string;
    scoring?: QuestionScoring;
  }>,
  scoringConfig?: ScoringConfig
): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  categoryScores?: Record<string, { score: number; maxScore: number; percentage: number }>;
} {
  if (!scoringConfig?.enabled) {
    return {
      totalScore: 0,
      maxScore: 0,
      percentage: 0,
    };
  }

  let totalScore = 0;
  let maxScore = scoringConfig.max_score || 100;
  const categoryScores: Record<string, { score: number; maxScore: number }> = {};

  // Calculer les scores par catégorie si configuré
  if (scoringConfig.categories && scoringConfig.categories.length > 0) {
    scoringConfig.categories.forEach((category) => {
      let categoryScore = 0;
      let categoryMaxScore = 0;

      category.questions.forEach((questionId) => {
        const question = questions.find((q) => q.id === questionId);
        const response = responses.find((r) => r.question_id === questionId);

        if (question?.scoring?.enabled && response) {
          const points = calculateQuestionScore(response, question.scoring);
          const weight = question.scoring.weight || 1;
          categoryScore += points * weight;
          categoryMaxScore += (getMaxPointsForQuestion(question.scoring) || 0) * weight;
        }
      });

      categoryScores[category.name] = {
        score: categoryScore,
        maxScore: categoryMaxScore,
      };

      // Appliquer le poids de la catégorie
      totalScore += categoryScore * category.weight;
      maxScore = Math.max(maxScore, categoryMaxScore * category.weight);
    });
  } else {
    // Calcul simple : somme de tous les scores
    questions.forEach((question) => {
      const response = responses.find((r) => r.question_id === question.id);
      if (question.scoring?.enabled && response) {
        const points = calculateQuestionScore(response, question.scoring);
        const weight = question.scoring.weight || 1;
        totalScore += points * weight;
      }
    });
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    maxScore,
    percentage: Math.round(percentage * 100) / 100,
    categoryScores: Object.entries(categoryScores).reduce(
      (acc, [name, { score, maxScore }]) => {
        acc[name] = {
          score,
          maxScore,
          percentage: maxScore > 0 ? Math.round((score / maxScore) * 100 * 100) / 100 : 0,
        };
        return acc;
      },
      {} as Record<string, { score: number; maxScore: number; percentage: number }>
    ),
  };
}

/**
 * Calcule le score pour une question individuelle
 */
function calculateQuestionScore(response: ResponseData, scoring: QuestionScoring): number {
  if (!scoring.enabled) return 0;

  const responseValue = response.response_data || response.response_value;

  // Si c'est un choix unique ou multiple
  if (Array.isArray(responseValue)) {
    // Choix multiple : somme des points
    return responseValue.reduce((sum, val) => {
      const points = scoring.points?.[val.toString()] || 0;
      return sum + points;
    }, 0);
  } else if (typeof responseValue === "object" && responseValue.selected) {
    // Format structuré avec "selected"
    return responseValue.selected.reduce((sum: number, val: any) => {
      const points = scoring.points?.[val.toString()] || 0;
      return sum + points;
    }, 0);
  } else if (typeof responseValue === "object" && responseValue.value !== undefined) {
    // Format structuré avec "value" (Likert, nombre)
    const value = responseValue.value;
    return scoring.points?.[value.toString()] || value || 0;
  } else {
    // Valeur simple
    return scoring.points?.[responseValue.toString()] || 0;
  }
}

/**
 * Obtient le score maximum possible pour une question
 */
function getMaxPointsForQuestion(scoring: QuestionScoring): number {
  if (!scoring.points) return 0;
  return Math.max(...Object.values(scoring.points));
}

/**
 * Interprète le score en niveau de santé mentale
 */
export function interpretMentalHealthScore(
  percentage: number
): {
  level: "excellent" | "good" | "moderate" | "poor" | "critical";
  label: string;
  color: string;
  recommendations?: string[];
} {
  if (percentage >= 80) {
    return {
      level: "excellent",
      label: "Excellent",
      color: "green",
      recommendations: ["Continuez à maintenir votre bien-être !"],
    };
  } else if (percentage >= 60) {
    return {
      level: "good",
      label: "Bien",
      color: "blue",
      recommendations: ["Vous vous portez bien, continuez ainsi."],
    };
  } else if (percentage >= 40) {
    return {
      level: "moderate",
      label: "Modéré",
      color: "yellow",
      recommendations: [
        "Prenez du temps pour vous reposer.",
        "Considérez des activités de relaxation.",
      ],
    };
  } else if (percentage >= 20) {
    return {
      level: "poor",
      label: "Préoccupant",
      color: "orange",
      recommendations: [
        "Il serait bénéfique de parler à quelqu'un de confiance.",
        "Considérez de consulter un professionnel de santé.",
      ],
    };
  } else {
    return {
      level: "critical",
      label: "Critique",
      color: "red",
      recommendations: [
        "Il est important de consulter un professionnel de santé rapidement.",
        "Parlez-en à votre coach ou responsable.",
      ],
    };
  }
}




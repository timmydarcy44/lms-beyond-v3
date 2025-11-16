// Types pour les résultats de tests et leur affichage

export type TestResultDisplayFormat = 
  | "ranking" // Classement par catégorie (pour soft skills)
  | "radar" // Graphique radar (pour test MAI)
  | "score" // Score simple
  | "detailed"; // Détails complets

export type TestCategoryResult = {
  category: string;
  score: number; // Score obtenu
  maxScore: number; // Score maximum possible
  percentage: number; // Pourcentage (score / maxScore * 100)
  rank?: number; // Classement dans cette catégorie (si applicable)
};

export type TestAttempt = {
  id: string;
  test_id: string;
  user_id: string;
  completed_at: string;
  total_score: number;
  max_score: number;
  percentage: number;
  category_results: TestCategoryResult[]; // Résultats par catégorie
  answers: Record<string, any>; // Réponses données (question_id -> answer)
  created_at: string;
  existingAnalysis?: string | null; // Analyse existante (si déjà générée)
};

export type TestWithAttempt = {
  id: string;
  title: string;
  description: string | null;
  display_format: TestResultDisplayFormat;
  attempt?: TestAttempt; // Dernière tentative ou tentative sélectionnée
  attempts_count?: number; // Nombre total de tentatives
};


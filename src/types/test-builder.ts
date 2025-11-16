export type TestQuestionType = "multiple" | "single" | "open" | "scale" | "likert";

export type TestQuestionOption = {
  id: string;
  value: string;
  correct: boolean;
  points?: number; // Points attribués pour cette option (défaut: 0 si incorrect, score de la question si correct)
};

export type TestQuestionScale = {
  min: number;
  max: number;
};

export type TestQuestionLikert = {
  min: number; // Par défaut 1
  max: number; // Par défaut 5 ou 7
  labels?: string[]; // Labels pour chaque point (ex: ["Pas du tout", "Un peu", "Modérément", "Beaucoup", "Tout à fait"])
};

export type TestQuestionKeywordRule = {
  id: string;
  keywords: string[];
  score: number;
};

export type TestBuilderQuestion = {
  id: string;
  title: string;
  type: TestQuestionType;
  context?: string;
  options?: TestQuestionOption[];
  scale?: TestQuestionScale;
  likert?: TestQuestionLikert;
  scaleScoreMap?: Record<number, number>;
  keywordRules?: TestQuestionKeywordRule[];
  score: number; // Score par défaut pour cette question (utilisé comme base pour les options)
  weight?: number; // Poids de la question dans le calcul final (défaut: 1)
  category?: string; // Catégorie de la question (ex: "Intelligence émotionnelle", "Adaptabilité")
  feedback?: string;
  tag?: string; // Tag/compétence associée (différent de la catégorie)
  status: "draft" | "ready";
  aiGenerated?: boolean;
  // Détection de biais cognitifs
  mirror_question_id?: string; // ID de la question miroir (si cette question a un miroir)
  is_mirror_of?: string; // ID de la question originale (si cette question est un miroir)
  is_positive?: boolean; // Pour Likert : true = formulation positive, false = formulation négative
  bias_detection_enabled?: boolean; // Activer la détection de biais pour cette question
};

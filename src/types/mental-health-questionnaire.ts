export type MentalQuestionType = "single_choice" | "multiple_choice" | "likert" | "text" | "number";

export type MentalQuestionOption = {
  id: string;
  label: string;
  value: string;
  points?: number;
};

export type MentalLikertScale = {
  min: number;
  max: number;
  labels?: Record<string, string>;
};

export type MentalQuestionScoring = {
  enabled: boolean;
  points?: Record<string, number>;
  weight?: number;
};

export type MentalQuestion = {
  id: string;
  question_text: string;
  question_type: MentalQuestionType;
  is_required: boolean;
  order_index: number;
  options?: MentalQuestionOption[];
  likert_scale?: MentalLikertScale;
  scoring?: MentalQuestionScoring;
  metadata?: Record<string, any> | null;
};

export type MentalScoringConfig = {
  enabled: boolean;
  max_score?: number;
  categories?: Array<{
    name: string;
    questions: string[];
    weight: number;
  }>;
};

export type MentalQuestionnaireDraft = {
  title: string;
  description?: string;
  is_active: boolean;
  frequency: "weekly" | "biweekly" | "monthly";
  send_day: number;
  send_time: string;
  target_roles: string[];
  metadata?: Record<string, any> | null;
  questions: MentalQuestion[];
  scoring_config?: MentalScoringConfig | null;
};

export type MentalAssessmentDetails = Record<
  string,
  {
    score: number;
    label: string;
    message: string;
  }
>;

export type MentalAssessment = {
  id: string;
  questionnaire_id: string;
  user_id: string;
  org_id: string;
  overall_score: number;
  dimension_scores: Record<string, number>;
  analysis_summary: string | null;
  analysis_details: MentalAssessmentDetails | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

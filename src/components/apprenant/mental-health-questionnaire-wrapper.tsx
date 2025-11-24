"use client";

import { MentalHealthQuestionnaire } from "./mental-health-questionnaire";

type Questionnaire = {
  id: string;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: "multiple_choice" | "single_choice" | "likert" | "text" | "number";
    is_required: boolean;
    conditional_logic?: any;
    options?: any;
    likert_scale?: any;
  }>;
};

type MentalHealthQuestionnaireWrapperProps = {
  questionnaire: Questionnaire;
  onSubmit: (responses: Record<string, any>) => Promise<void>;
};

export function MentalHealthQuestionnaireWrapper({
  questionnaire,
  onSubmit,
}: MentalHealthQuestionnaireWrapperProps) {
  return <MentalHealthQuestionnaire questionnaire={questionnaire} onSubmit={onSubmit} />;
}









export type DiscLabel = "D" | "I" | "S" | "C";

export type DiscQuestionOption = {
  label: DiscLabel;
  text: string;
};

export type DiscQuestion = {
  id: number;
  situation: string;
  options: [DiscQuestionOption, DiscQuestionOption, DiscQuestionOption, DiscQuestionOption];
};

export type DiscIpsativeResponse = {
  question_index: number;
  question_id: number;
  situation: string;
  displayed_order: DiscLabel[];
  most: { label: DiscLabel; text: string };
  least: { label: DiscLabel; text: string };
};

export type DiscResultsPayload = {
  profile_id: string;
  responses: DiscIpsativeResponse[];
  scores: Record<string, unknown>;
  raw_scores: Record<DiscLabel, number>;
  normalized_scores: Record<DiscLabel, number>;
  final_profile: string;
  is_mixed_profile: boolean;
  secondary_profile: string | null;
  dominant_profile: string;
  updated_at: string;
};

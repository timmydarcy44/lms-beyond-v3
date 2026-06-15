export type BeyondIndexAxisId =
  | "competences"
  | "formation"
  | "ia"
  | "recrutement"
  | "transmission"
  | "vision-rh";

export type QuestionType = "scale" | "single" | "multi";

export type ScaleAnswer = 1 | 2 | 3 | 4 | 5;

export type QuestionOption = {
  id: string;
  label: string;
  points: number;
  exclusive?: boolean;
};

export type BeyondIndexQuestion = {
  id: string;
  axisId: BeyondIndexAxisId;
  type: QuestionType;
  label: string;
  options?: QuestionOption[];
  maxPoints: number;
  maxSelections?: number;
  scaleLabels?: { min: string; max: string };
};

export type BeyondIndexAnswers = Record<string, ScaleAnswer | string | string[]>;

export type AxisStatus = "risk" | "consolidate" | "strength";

export type AxisScore = {
  id: BeyondIndexAxisId;
  label: string;
  raw: number;
  max: number;
  score: number;
  status: AxisStatus;
  statusLabel: string;
};

export type GlobalProfile = {
  id: "starter" | "transition" | "structured" | "advanced";
  title: string;
  description: string;
};

export type BeyondIndexContact = {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  role: string;
  orgSize: string;
  phone?: string;
};

export type BeyondIndexResult = {
  answers: BeyondIndexAnswers;
  contact: BeyondIndexContact;
  globalScore: number;
  globalProfile: GlobalProfile;
  axisScores: AxisScore[];
  strengths: string[];
  risks: string[];
  recommendations: string[];
  completedAt: string;
};

export type BeyondIndexStep = "intro" | "question" | "contact" | "results";

/** Business-defined denominator for global score (see scoring.ts). */
export const BEYOND_INDEX_MAX_RAW = 208;

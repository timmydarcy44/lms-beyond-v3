import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";

export type SkillValidationMethod = "interview" | "import";

export type SkillValidationVerdict =
  | "validated"
  | "pending"
  | "insufficient"
  | "expert_needed";

/** Statut affiché sur le profil public */
export type PublicSkillStatus = "declared" | "ia_analyzed" | "validated" | "expert_validated";

export type SkillValidationHistoryEntry = {
  id: string;
  date: string;
  type: "interview" | "import" | "proof_added" | "ia_validation" | "expert_validation";
  title: string;
  confidenceScore?: number;
  statusLabel: string;
  verdict?: SkillValidationVerdict;
};

export type SkillValidationSession = {
  method: SkillValidationMethod;
  status: "in_progress" | "analyzed";
  verdict?: SkillValidationVerdict;
  confidenceScore?: number;
  declaredLevel?: HardSkillLevel;
  estimatedLevel?: HardSkillLevel;
  summary?: string;
  detailedAnalysis?: string;
  strengths?: string[];
  improvementAreas?: string[];
  evaluationMethods?: string[];
  analysis?: string;
  opinion?: string;
  questions?: string[];
  answers?: string[];
  proofUrl?: string;
  proofNote?: string;
  analyzedAt?: string;
  badgeSuggested?: boolean;
  expertValidated?: boolean;
  expertValidatedAt?: string;
  history?: SkillValidationHistoryEntry[];
};

export function interviewQuestionCount(level: HardSkillLevel): number {
  switch (level) {
    case "Débutant":
      return 3;
    case "Intermédiaire":
      return 5;
    case "Confirmé":
      return 8;
    case "Expert":
      return 12;
    default:
      return 5;
  }
}

export function verdictToProofLevel(verdict: SkillValidationVerdict): "declared" | "justified" | "evaluated" | "certified" {
  if (verdict === "validated") return "evaluated";
  if (verdict === "pending") return "justified";
  return "declared";
}

export function verdictLabel(verdict: SkillValidationVerdict): string {
  switch (verdict) {
    case "validated":
      return "Validation obtenue";
    case "pending":
      return "Validation complémentaire recommandée";
    case "insufficient":
      return "Preuves insuffisantes";
    case "expert_needed":
      return "Validation expert nécessaire";
  }
}

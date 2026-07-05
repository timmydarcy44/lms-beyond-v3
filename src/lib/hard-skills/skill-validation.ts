import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";

export type SkillValidationMethod = "interview" | "import";

export type SkillValidationVerdict =
  | "validated"
  | "pending"
  | "insufficient"
  | "expert_needed";

export type SkillValidationSession = {
  method: SkillValidationMethod;
  status: "in_progress" | "analyzed";
  verdict?: SkillValidationVerdict;
  confidenceScore?: number;
  analysis?: string;
  opinion?: string;
  questions?: string[];
  answers?: string[];
  proofUrl?: string;
  proofNote?: string;
  analyzedAt?: string;
  badgeSuggested?: boolean;
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
      return "Compétence validée";
    case "pending":
      return "Validation en attente";
    case "insufficient":
      return "Validation insuffisante";
    case "expert_needed":
      return "Expert EDGE nécessaire";
  }
}

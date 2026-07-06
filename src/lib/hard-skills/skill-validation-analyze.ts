import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { SkillAnalysisApiResult } from "@/lib/hard-skills/skill-validation-analysis";
import { SKILL_ANALYSIS_JSON_SHAPE } from "@/lib/hard-skills/skill-validation-analysis";
import type { SkillValidationVerdict } from "@/lib/hard-skills/skill-validation";
import { DEFAULT_EDGE_EVALUATION_METHODS } from "@/lib/edge-brand-copy";
import { generateJSON, getOpenAIClient } from "@/lib/ai/openai-client";

export const SKILL_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    confidenceScore: { type: "number" },
    verdict: {
      type: "string",
      enum: ["validated", "pending", "insufficient", "expert_needed"],
    },
    estimatedLevel: {
      type: "string",
      enum: ["Débutant", "Intermédiaire", "Confirmé", "Expert"],
    },
    summary: { type: "string" },
    detailedAnalysis: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvementAreas: { type: "array", items: { type: "string" } },
    evaluationMethods: { type: "array", items: { type: "string" } },
    opinion: { type: "string" },
    badgeSuggested: { type: "boolean" },
  },
  required: ["confidenceScore", "verdict", "estimatedLevel", "summary"],
};

function scoreAnswers(answers: string[]): { filled: number; totalChars: number } {
  const filled = answers.filter((a) => a.trim().length >= 30).length;
  const totalChars = answers.reduce((n, a) => n + a.trim().length, 0);
  return { filled, totalChars };
}

export function buildFallbackSkillAnalysis(params: {
  skillName: string;
  level: HardSkillLevel;
  mode: "interview" | "proof";
  questions?: string[];
  answers?: string[];
  proofNote?: string;
  proofUrl?: string;
}): SkillAnalysisApiResult {
  const { skillName, level, mode } = params;
  let verdict: SkillValidationVerdict = "pending";
  let confidence = 48;
  let estimatedLevel = level;

  if (mode === "interview") {
    const answers = params.answers ?? [];
    const { filled, totalChars } = scoreAnswers(answers);
    const ratio = answers.length ? filled / answers.length : 0;

    if (filled >= 3 && totalChars >= 400 && ratio >= 0.6) {
      verdict = "validated";
      confidence = Math.min(78, 55 + filled * 5);
    } else if (filled >= 1 || totalChars >= 120) {
      verdict = "pending";
      confidence = Math.min(65, 40 + filled * 8);
    } else {
      verdict = "insufficient";
      confidence = 32;
    }
  } else {
    const hasUrl = Boolean(params.proofUrl?.trim());
    const noteLen = (params.proofNote ?? "").trim().length;
    if (hasUrl && noteLen >= 40) {
      verdict = "pending";
      confidence = 62;
    } else if (hasUrl || noteLen >= 80) {
      verdict = "pending";
      confidence = 52;
    } else {
      verdict = "insufficient";
      confidence = 38;
    }
  }

  const summary =
    mode === "interview"
      ? `Analyse EDGE basée sur votre entretien expérientiel pour « ${skillName} ». Les réponses fournies ${verdict === "validated" ? "démontrent une pratique concrète" : verdict === "pending" ? "méritent un complément de preuves" : "restent trop succinctes pour valider le niveau déclaré"}.`
      : `Analyse EDGE de la preuve déposée pour « ${skillName} ». ${verdict === "insufficient" ? "La preuve nécessite davantage de contexte ou d'éléments vérifiables." : "La preuve sera examinée dans le cadre de votre profil EDGE."}`;

  return {
    confidenceScore: confidence,
    verdict,
    estimatedLevel,
    summary,
    detailedAnalysis: summary,
    analysis: summary,
    strengths:
      verdict !== "insufficient"
        ? [`Mobilisation de la compétence « ${skillName} » documentée dans votre démarche EDGE`]
        : [],
    improvementAreas:
      verdict !== "validated"
        ? [
            "Enrichir les exemples concrets (contexte, actions, résultats)",
            "Ajouter une preuve complémentaire (document, lien, portfolio)",
          ]
        : [],
    evaluationMethods: [...DEFAULT_EDGE_EVALUATION_METHODS],
    opinion:
      verdict === "validated"
        ? "Le niveau déclaré est cohérent avec les éléments partagés."
        : verdict === "pending"
          ? "Analyse préliminaire — complétez votre dossier pour renforcer la validation."
          : "Éléments insuffisants pour confirmer le niveau à ce stade.",
    badgeSuggested: verdict === "validated" && confidence >= 70,
  };
}

export async function analyzeSkillValidation(params: {
  skillName: string;
  level: HardSkillLevel;
  prompt: string;
  fallback: () => SkillAnalysisApiResult;
}): Promise<{ result: SkillAnalysisApiResult; source: "ai" | "fallback" }> {
  if (!getOpenAIClient()) {
    return { result: params.fallback(), source: "fallback" };
  }

  const aiResult = await generateJSON(
    `${params.prompt}\n\nRéponds UNIQUEMENT en JSON valide selon ce schéma :\n${SKILL_ANALYSIS_JSON_SHAPE}`,
    SKILL_ANALYSIS_JSON_SCHEMA,
    "Tu es l'analyseur EDGE de compétences professionnelles. Sois factuel, bienveillant et exigeant.",
  );

  if (aiResult?.verdict) {
    return {
      result: {
        confidenceScore: Number(aiResult.confidenceScore) || 50,
        verdict: String(aiResult.verdict) as SkillValidationVerdict,
        estimatedLevel: String(aiResult.estimatedLevel ?? params.level),
        summary: String(aiResult.summary ?? ""),
        detailedAnalysis: String(aiResult.detailedAnalysis ?? aiResult.summary ?? ""),
        analysis: String(aiResult.detailedAnalysis ?? aiResult.summary ?? ""),
        strengths: Array.isArray(aiResult.strengths) ? aiResult.strengths.map(String) : [],
        improvementAreas: Array.isArray(aiResult.improvementAreas)
          ? aiResult.improvementAreas.map(String)
          : [],
        evaluationMethods: Array.isArray(aiResult.evaluationMethods)
          ? aiResult.evaluationMethods.map(String)
          : [],
        opinion: String(aiResult.opinion ?? ""),
        badgeSuggested: Boolean(aiResult.badgeSuggested),
      },
      source: "ai",
    };
  }

  return { result: params.fallback(), source: "fallback" };
}

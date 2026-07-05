import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";
import { parseHardSkillPortfolio } from "@/lib/hard-skills/hard-skills-portfolio";
import type {
  SkillValidationHistoryEntry,
  SkillValidationMethod,
  SkillValidationSession,
  SkillValidationVerdict,
} from "@/lib/hard-skills/skill-validation";
import {
  verdictLabel,
  type PublicSkillStatus,
} from "@/lib/hard-skills/skill-validation";
import { DEFAULT_EDGE_EVALUATION_METHODS, sanitizeEdgePublicCopy } from "@/lib/edge-brand-copy";

export type SkillAnalysisApiResult = {
  confidenceScore: number;
  verdict: SkillValidationVerdict;
  estimatedLevel?: string;
  summary?: string;
  detailedAnalysis?: string;
  analysis?: string;
  strengths?: string[];
  improvementAreas?: string[];
  evaluationMethods?: string[];
  opinion?: string;
  badgeSuggested?: boolean;
};

export const SKILL_ANALYSIS_JSON_SHAPE = `{
  "confidenceScore": 0-100,
  "verdict": "validated" | "pending" | "insufficient" | "expert_needed",
  "estimatedLevel": "Débutant" | "Intermédiaire" | "Confirmé" | "Expert",
  "summary": "texte expliquant POURQUOI ce niveau (2-3 phrases, factuel, pour le recruteur)",
  "detailedAnalysis": "analyse détaillée complète expliquant la décision",
  "strengths": ["observation positive courte (ex: maîtrise du vocabulaire)", "force 2"],
  "improvementAreas": ["axe à renforcer court (ex: peu d'exemples terrain)", "axe 2"],
  "evaluationMethods": ["Entretien expérientiel EDGE", "Analyse sémantique EDGE", "Cohérence avec le référentiel métier"],
  "opinion": "avis EDGE",
  "badgeSuggested": true/false
}`;

function normalizeLevel(raw: string | undefined, fallback: HardSkillLevel): HardSkillLevel {
  const levels: HardSkillLevel[] = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];
  if (raw && levels.includes(raw as HardSkillLevel)) return raw as HardSkillLevel;
  return fallback;
}

function historyId(): string {
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function verdictToHistoryStatusLabel(verdict: SkillValidationVerdict): string {
  return verdictLabel(verdict);
}

export function buildHistoryEntry(params: {
  type: SkillValidationHistoryEntry["type"];
  title: string;
  confidenceScore?: number;
  statusLabel: string;
  verdict?: SkillValidationVerdict;
}): SkillValidationHistoryEntry {
  return {
    id: historyId(),
    date: new Date().toISOString(),
    type: params.type,
    title: params.title,
    confidenceScore: params.confidenceScore,
    statusLabel: params.statusLabel,
    verdict: params.verdict,
  };
}

export function appendValidationHistory(
  session: SkillValidationSession | undefined,
  entry: SkillValidationHistoryEntry,
): SkillValidationSession {
  const base: SkillValidationSession = session ?? { method: "interview", status: "in_progress" };
  return {
    ...base,
    history: [...(base.history ?? []), entry],
  };
}

export function parseSkillAnalysisApiResult(
  raw: Record<string, unknown>,
  declaredLevel: HardSkillLevel,
): SkillAnalysisApiResult {
  return {
    confidenceScore: Number(raw.confidenceScore) || 0,
    verdict: String(raw.verdict ?? "pending") as SkillValidationVerdict,
    estimatedLevel: String(raw.estimatedLevel ?? declaredLevel),
    summary: String(raw.summary ?? raw.analysis ?? "").trim(),
    detailedAnalysis: String(raw.detailedAnalysis ?? raw.analysis ?? "").trim(),
    analysis: String(raw.analysis ?? raw.detailedAnalysis ?? "").trim(),
    strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String).filter(Boolean) : [],
    improvementAreas: Array.isArray(raw.improvementAreas) ? raw.improvementAreas.map(String).filter(Boolean) : [],
    evaluationMethods: Array.isArray(raw.evaluationMethods)
      ? raw.evaluationMethods.map(String).filter(Boolean)
      : [],
    opinion: String(raw.opinion ?? "").trim(),
    badgeSuggested: Boolean(raw.badgeSuggested),
  };
}

export function buildValidationSessionFromAnalysis(params: {
  method: SkillValidationMethod;
  declaredLevel: HardSkillLevel;
  analysis: SkillAnalysisApiResult;
  questions?: string[];
  answers?: string[];
  proofUrl?: string;
  proofNote?: string;
  previous?: SkillValidationSession;
}): SkillValidationSession {
  const { analysis, method, declaredLevel, previous } = params;
  const estimatedLevel = normalizeLevel(analysis.estimatedLevel, declaredLevel);

  const interviewEntry = buildHistoryEntry({
    type: method === "interview" ? "interview" : "import",
    title: method === "interview" ? "Entretien expérientiel réalisé" : "Preuve déposée",
    confidenceScore: analysis.confidenceScore,
    statusLabel: verdictToHistoryStatusLabel(analysis.verdict),
    verdict: analysis.verdict,
  });

  const analysisEntry = buildHistoryEntry({
    type: "ia_validation",
    title: "Analyse EDGE finalisée",
    confidenceScore: analysis.confidenceScore,
    statusLabel: verdictToHistoryStatusLabel(analysis.verdict),
    verdict: analysis.verdict,
  });

  let session: SkillValidationSession = {
    method,
    status: "analyzed",
    verdict: analysis.verdict,
    confidenceScore: analysis.confidenceScore,
    declaredLevel,
    estimatedLevel,
    summary: analysis.summary || analysis.analysis,
    detailedAnalysis: analysis.detailedAnalysis || analysis.analysis,
    strengths: analysis.strengths,
    improvementAreas: analysis.improvementAreas,
    evaluationMethods:
      analysis.evaluationMethods.length > 0
        ? analysis.evaluationMethods.map(sanitizeEdgePublicCopy)
        : [...DEFAULT_EDGE_EVALUATION_METHODS],
    analysis: analysis.detailedAnalysis || analysis.analysis,
    opinion: analysis.opinion,
    questions: params.questions,
    answers: params.answers,
    proofUrl: params.proofUrl,
    proofNote: params.proofNote,
    analyzedAt: new Date().toISOString(),
    badgeSuggested: analysis.badgeSuggested,
    history: [],
  };

  session = appendValidationHistory(previous, interviewEntry);
  session = appendValidationHistory(session, analysisEntry);

  return session;
}

export type PublicSkillCardData = {
  name: string;
  category: string;
  declaredLevel: HardSkillLevel;
  estimatedLevel: HardSkillLevel;
  status: PublicSkillStatus;
  statusLabel: string;
  confidenceScore: number | null;
  hasAnalysis: boolean;
  validation?: SkillValidationSession;
};

export function resolvePublicSkillStatus(meta: StoredHardSkillMeta | undefined): PublicSkillStatus {
  if (meta?.validation?.expertValidated || meta?.proofLevel === "certified") return "expert_validated";
  if (meta?.validation?.verdict === "validated" || meta?.proofLevel === "evaluated") return "validated";
  if (meta?.validation?.status === "analyzed") return "ia_analyzed";
  return "declared";
}

export function publicStatusConfig(status: PublicSkillStatus): {
  label: string;
  emoji: string;
  className: string;
} {
  switch (status) {
    case "expert_validated":
      return {
        label: "EDGE Verified",
        emoji: "🟣",
        className: "border-violet-200 bg-violet-50 text-violet-800",
      };
    case "validated":
      return { label: "Compétence vérifiée", emoji: "🟢", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
    case "ia_analyzed":
      return {
        label: "Analyse terminée",
        emoji: "🟡",
        className: "border-amber-200 bg-amber-50 text-amber-900",
      };
    default:
      return { label: "Compétence déclarée", emoji: "🔵", className: "border-sky-200 bg-sky-50 text-sky-800" };
  }
}

export function toPublicSkillCard(
  name: string,
  meta: StoredHardSkillMeta | undefined,
  category: string,
  declaredLevel: HardSkillLevel,
): PublicSkillCardData {
  const status = resolvePublicSkillStatus(meta);
  const cfg = publicStatusConfig(status);
  const validation = meta?.validation;
  return {
    name,
    category,
    declaredLevel,
    estimatedLevel: validation?.estimatedLevel ?? declaredLevel,
    status,
    statusLabel: cfg.label,
    confidenceScore: validation?.confidenceScore ?? null,
    hasAnalysis: Boolean(
      validation?.status === "analyzed" ||
        validation?.summary ||
        validation?.detailedAnalysis ||
        validation?.analysis ||
        (validation?.strengths?.length ?? 0) > 0,
    ),
    validation,
  };
}

export function buildPublicSkillCards(
  hardSkills: string[],
  metadata: Record<string, StoredHardSkillMeta>,
): PublicSkillCardData[] {
  const records = parseHardSkillPortfolio(hardSkills, metadata);
  return records.map((r) => toPublicSkillCard(r.name, metadata[r.name], r.category, r.level));
}

export function computeEdgeReliabilityIndex(
  hardSkills: string[],
  metadata: Record<string, StoredHardSkillMeta>,
): number {
  const cards = buildPublicSkillCards(hardSkills, metadata);
  if (!cards.length) return 0;

  let points = 0;
  let maxPoints = cards.length * 100;

  for (const card of cards) {
    let cardScore = 15;
    if (card.status !== "declared") cardScore += 25;
    if (card.status === "validated" || card.status === "expert_validated") cardScore += 35;
    if (card.status === "expert_validated") cardScore += 15;
    if (card.confidenceScore != null) cardScore += Math.round(card.confidenceScore * 0.1);
    if (metadata[card.name]?.proof?.url || metadata[card.name]?.proof?.note) cardScore += 10;
    points += Math.min(100, cardScore);
  }

  return Math.round((points / maxPoints) * 100);
}

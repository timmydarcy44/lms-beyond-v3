import {
  BADGE_LEVEL_OPTIONS,
  formatEvaluationMethodsSummary,
  isBadgeEvaluationMethodId,
} from "@/lib/openbadges/badge-evaluation";
import {
  buildAggregatedEvaluationPrompt,
  enrichMethodConfigsFromRaw,
  parseMethodConfigs,
  validateMethodConfigsForMethods,
  type BadgeMethodConfig,
} from "@/lib/openbadges/badge-method-config";

export type ParsedBadgeEvaluationConfig = {
  level: number;
  evaluationMethods: string[];
  validatorExpertId: string;
  expectedModalities: string;
  methodConfigs: BadgeMethodConfig[];
  aiEvaluationPrompt: string;
};

export function parseBadgeEvaluationConfig(payload: {
  level?: unknown;
  evaluationMethods?: unknown;
  validatorExpertId?: unknown;
  receivability?: { expectedModalities?: unknown; methodConfigs?: unknown };
  methodConfigs?: unknown;
}): { ok: true; data: ParsedBadgeEvaluationConfig } | { ok: false; issues: string[] } {
  const issues: string[] = [];

  const levelRaw = payload.level;
  const level =
    typeof levelRaw === "number"
      ? levelRaw
      : typeof levelRaw === "string" && levelRaw.trim()
        ? Number.parseInt(levelRaw, 10)
        : NaN;
  if (!Number.isInteger(level) || !BADGE_LEVEL_OPTIONS.includes(level as (typeof BADGE_LEVEL_OPTIONS)[number])) {
    issues.push("level invalide (niveau 1 à 5 requis)");
  }

  const methodsRaw = payload.evaluationMethods;
  const evaluationMethods = Array.isArray(methodsRaw)
    ? methodsRaw.map((m) => String(m).trim()).filter(Boolean)
    : [];
  if (evaluationMethods.length === 0) {
    issues.push("evaluationMethods : au moins une méthode requise");
  } else if (!evaluationMethods.every(isBadgeEvaluationMethodId)) {
    issues.push("evaluationMethods : méthode non reconnue");
  }

  const validatorExpertId =
    typeof payload.validatorExpertId === "string" ? payload.validatorExpertId.trim() : "";
  if (!validatorExpertId) {
    issues.push("validatorExpertId manquant");
  }

  const modalitiesFromPayload =
    typeof payload.receivability?.expectedModalities === "string"
      ? payload.receivability.expectedModalities.trim()
      : "";
  const expectedModalities =
    modalitiesFromPayload.length > 0
      ? modalitiesFromPayload
      : formatEvaluationMethodsSummary(evaluationMethods);

  const rawMethodConfigs = payload.methodConfigs ?? payload.receivability?.methodConfigs;
  const methodConfigs = enrichMethodConfigsFromRaw(
    parseMethodConfigs(rawMethodConfigs),
    rawMethodConfigs,
  );
  const configError = validateMethodConfigsForMethods(evaluationMethods, methodConfigs);
  if (configError) {
    issues.push(configError);
  }

  if (!expectedModalities && methodConfigs.length > 0) {
    // ok — dérivé des méthodes
  } else if (!expectedModalities) {
    issues.push("receivability.expectedModalities manquant");
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const finalModalities =
    expectedModalities || formatEvaluationMethodsSummary(evaluationMethods);

  return {
    ok: true,
    data: {
      level,
      evaluationMethods,
      validatorExpertId,
      expectedModalities: finalModalities,
      methodConfigs,
      aiEvaluationPrompt: buildAggregatedEvaluationPrompt(methodConfigs),
    },
  };
}

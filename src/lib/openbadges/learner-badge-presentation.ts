import { getServiceRoleClient } from "@/lib/supabase/server";
import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import { formatEvaluationMethodsSummary, isBadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import {
  resolveMethodConfigsForBadge,
  type BadgeMethodConfig,
} from "@/lib/openbadges/badge-method-config";
import { getEnrolledCourseIds } from "@/lib/openbadges/enrollment";
import { isLearnerVisibleBadgeStatus } from "@/lib/openbadges/badge-earner-access";
import { resolveValidatorPhotoUrl } from "@/lib/validators/photo-url";

export type LearnerBadgeCriterion = {
  label: string;
  description?: string | null;
};

export type LearnerBadgeValidator = {
  id: string;
  fullName: string;
  professionalTitle: string | null;
  description: string | null;
  avatarUrl: string | null;
};

export type LearnerBadgePresentation = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  level: number | null;
  criteria: LearnerBadgeCriterion[];
  criteriaMarkdown: string | null;
  evaluationMethodIds: string[];
  evaluationMethodsLabel: string;
  methodConfigs: BadgeMethodConfig[];
  validator: LearnerBadgeValidator | null;
  eligible: boolean;
  requiresEnrollment: boolean;
};

async function fetchValidator(validatorId: string | null | undefined): Promise<LearnerBadgeValidator | null> {
  const id = String(validatorId ?? "").trim();
  if (!id) return null;

  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  let row: Record<string, unknown> | null = null;

  const full = await supabase.from("validators").select("*").eq("id", id).maybeSingle();
  if (!full.error && full.data) {
    row = full.data as Record<string, unknown>;
  } else {
    const minimal = await supabase
      .from("validators")
      .select("id, first_name, last_name, description, professionnal_title")
      .eq("id", id)
      .maybeSingle();
    if (!minimal.error && minimal.data) {
      row = minimal.data as Record<string, unknown>;
    }
  }

  if (!row) return null;
  const first = String(row.first_name ?? "").trim();
  const last = String(row.last_name ?? "").trim();
  const fullName =
    String(row.full_name ?? "").trim() || [first, last].filter(Boolean).join(" ") || "Validateur";

  return {
    id: String(row.id),
    fullName,
    professionalTitle: row.professionnal_title ? String(row.professionnal_title) : null,
    description: row.description ? String(row.description) : null,
    avatarUrl: resolveValidatorPhotoUrl(row),
  };
}

export async function getLearnerBadgePresentation(
  badgeClassId: string,
  userId: string,
  orgIds: string[],
): Promise<LearnerBadgePresentation | null> {
  const row = await getOpenBadgeClassByIdOnly(badgeClassId);
  if (!row) return null;

  const orgId = String(row.orgId ?? "").trim();
  if (!orgId || !orgIds.includes(orgId)) return null;
  if (!isLearnerVisibleBadgeStatus(row.status)) return null;
  if (!Boolean(row.visibleInLearnerDashboard)) return null;

  const requiresEnrollment = Boolean(row.requiresEnrollment);
  const methodConfigs = resolveMethodConfigsForBadge(row as Record<string, unknown>);
  const evaluationMethodIds =
    methodConfigs.length > 0
      ? methodConfigs.map((m) => m.methodId)
      : Array.isArray(row.evaluationMethods)
        ? row.evaluationMethods.filter((id): id is string => isBadgeEvaluationMethodId(String(id)))
        : [];

  const criteriaRaw = Array.isArray(row.criteria) ? row.criteria : [];
  const criteria: LearnerBadgeCriterion[] = criteriaRaw
    .map((item) => {
      const c = item as Record<string, unknown>;
      const label = String(c.label ?? "").trim();
      if (!label) return null;
      return {
        label,
        description: c.description ? String(c.description) : null,
      };
    })
    .filter((c): c is LearnerBadgeCriterion => Boolean(c));

  let eligible = !requiresEnrollment;
  if (requiresEnrollment && row.requiredCourseId) {
    const enrolled = await getEnrolledCourseIds(userId, orgId, [String(row.requiredCourseId)]);
    eligible = enrolled.has(String(row.requiredCourseId));
  }

  let validatorId = String(row.validatorExpertId ?? "").trim();
  if (!validatorId) {
    const supabase = getServiceRoleClient();
    if (supabase) {
      const { data: rawBadge } = await supabase
        .from("open_badges")
        .select("evaluation_config")
        .eq("id", badgeClassId)
        .maybeSingle();
      const ec = (rawBadge as { evaluation_config?: unknown } | null)?.evaluation_config;
      if (ec && typeof ec === "object" && !Array.isArray(ec)) {
        validatorId = String((ec as Record<string, unknown>).validatorExpertId ?? "").trim();
      }
    }
  }

  const validator = await fetchValidator(validatorId || null);

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    imageUrl: row.imageUrl ? String(row.imageUrl) : null,
    level: typeof row.level === "number" ? row.level : null,
    criteria,
    criteriaMarkdown: row.criteriaMarkdown ? String(row.criteriaMarkdown) : null,
    evaluationMethodIds,
    evaluationMethodsLabel: formatEvaluationMethodsSummary(evaluationMethodIds),
    methodConfigs,
    validator,
    eligible,
    requiresEnrollment,
  };
}

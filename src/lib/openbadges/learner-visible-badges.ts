import { getEnrolledCourseIds } from "@/lib/openbadges/enrollment";
import {
  canUseOpenBadgesSupabaseRepo,
  listLearnerVisibleBadgesViaSupabase,
  OpenBadgesRpcUnavailableError,
} from "@/lib/openbadges/badge-repository";
import { countLearnerBadgeAttempts } from "@/lib/openbadges/badge-earner-attempt";
import { buildOpenBadgeLinkedInShareUrl } from "@/lib/openbadges/linkedin-share";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";
import { getLearnerOpenBadgeAward } from "@/lib/openbadges/open-badge-earner-submissions";
import { prisma, resolveAndApplyDatabaseUrl } from "@/lib/prisma";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type LearnerVisibleOpenBadge = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  level: number | null;
  requiresEnrollment: boolean;
  eligible: boolean;
  /** Page de présentation du badge (critères, validateur, CTA épreuve). */
  presentationHref: string;
  /** Parcours épreuve séquentiel. */
  epreuveHref: string;
  /** @deprecated Utiliser presentationHref */
  submitHref: string;
  awarded: boolean;
  /** Nombre de soumissions enregistrées (essais). */
  attemptsCount: number;
};

export type LearnerEarnedOpenBadge = {
  id: string;
  name: string;
  imageUrl: string | null;
  level: number | null;
  awardedAt: string;
  shareUrl: string;
  linkedInShareUrl: string;
};

async function loadEvaluationConfigByBadgeIds(
  badgeIds: string[],
): Promise<Map<string, unknown>> {
  const map = new Map<string, unknown>();
  if (badgeIds.length === 0) return map;
  const supabase = getServiceRoleClient();
  if (!supabase) return map;
  const { data } = await supabase
    .from("open_badges")
    .select("id, evaluation_config")
    .in("id", badgeIds);
  for (const row of data ?? []) {
    map.set(String(row.id), (row as { evaluation_config?: unknown }).evaluation_config);
  }
  return map;
}

export async function getLearnerVisibleOpenBadges(
  userId: string,
  orgId: string | null,
  orgIds?: string[],
): Promise<LearnerVisibleOpenBadge[]> {
  const resolvedOrgIds = Array.from(
    new Set(
      (orgIds?.length ? orgIds : orgId ? [orgId] : [])
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
  if (resolvedOrgIds.length === 0) return [];

  let rows: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    level: number | null;
    requiresEnrollment: boolean;
    requiredCourseId: string | null;
  }> = [];

  if (canUseOpenBadgesSupabaseRepo()) {
    try {
      rows = await listLearnerVisibleBadgesViaSupabase(resolvedOrgIds);
    } catch (err) {
      if (!(err instanceof OpenBadgesRpcUnavailableError)) {
        console.warn("[learner-visible-badges] supabase:", err);
      }
    }
  }

  if (rows.length === 0 && resolveAndApplyDatabaseUrl()) {
    const badgeClasses = await prisma.badgeClass.findMany({
      where: {
        orgId: { in: resolvedOrgIds },
        status: "ACTIVE",
        visibleInLearnerDashboard: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        imageTemplateUrl: true,
        level: true,
        requiresEnrollment: true,
        requiredCourseId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    rows = badgeClasses.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl ?? badge.imageTemplateUrl ?? null,
      level: badge.level,
      requiresEnrollment: badge.requiresEnrollment,
      requiredCourseId: badge.requiredCourseId,
    }));
  }

  if (rows.length === 0) return [];

  const requiredCourseIds = rows
    .map((b) => b.requiredCourseId)
    .filter((id): id is string => Boolean(id));

  let enrolledCourseIds = new Set<string>();
  if (requiredCourseIds.length > 0) {
    enrolledCourseIds = await getEnrolledCourseIds(userId, resolvedOrgIds[0], requiredCourseIds);
  }

  const configById = await loadEvaluationConfigByBadgeIds(rows.map((b) => b.id));

  const enriched = rows.map((badge) => {
    const eligible = badge.requiresEnrollment
      ? Boolean(badge.requiredCourseId && enrolledCourseIds.has(badge.requiredCourseId))
      : true;
    const evaluationConfig = configById.get(badge.id);
    const awarded = Boolean(getLearnerOpenBadgeAward(evaluationConfig, userId));
    const attemptsCount = countLearnerBadgeAttempts(evaluationConfig, userId);
    const base = `/dashboard/apprenant/open-badges/${badge.id}`;
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl,
      level: badge.level,
      requiresEnrollment: badge.requiresEnrollment,
      eligible,
      presentationHref: base,
      epreuveHref: `${base}/epreuve`,
      submitHref: base,
      awarded,
      attemptsCount,
    };
  });

  return enriched.filter((b) => !b.awarded);
}

export async function getLearnerEarnedOpenBadges(
  userId: string,
  orgIds: string[],
): Promise<LearnerEarnedOpenBadge[]> {
  const resolvedOrgIds = Array.from(
    new Set(orgIds.map((id) => id.trim()).filter(Boolean)),
  );
  if (resolvedOrgIds.length === 0) return [];

  let rows: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    level: number | null;
  }> = [];

  if (canUseOpenBadgesSupabaseRepo()) {
    try {
      const listed = await listLearnerVisibleBadgesViaSupabase(resolvedOrgIds);
      rows = listed.map((b) => ({
        id: b.id,
        name: b.name,
        imageUrl: b.imageUrl,
        level: b.level,
      }));
    } catch {
      /* ignore */
    }
  }

  if (rows.length === 0) return [];

  const configById = await loadEvaluationConfigByBadgeIds(rows.map((b) => b.id));
  const earned: LearnerEarnedOpenBadge[] = [];

  for (const badge of rows) {
    const award = getLearnerOpenBadgeAward(configById.get(badge.id), userId);
    if (!award) continue;
    const shareUrl = getBadgeCriteriaUrl(badge.id);
    earned.push({
      id: badge.id,
      name: badge.name,
      imageUrl: badge.imageUrl ?? award.imageUrl ?? null,
      level: badge.level,
      awardedAt: award.awardedAt,
      shareUrl,
      linkedInShareUrl: buildOpenBadgeLinkedInShareUrl({
        shareUrl,
        badgeName: badge.name,
        level: badge.level,
      }),
    });
  }

  earned.sort((a, b) => Date.parse(b.awardedAt) - Date.parse(a.awardedAt));
  return earned;
}

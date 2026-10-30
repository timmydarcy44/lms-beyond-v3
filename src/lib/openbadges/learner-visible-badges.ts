import { getEnrolledCourseIds } from "@/lib/openbadges/enrollment";
import {
  canUseOpenBadgesSupabaseRepo,
  listLearnerVisibleBadgesViaSupabase,
  OpenBadgesRpcUnavailableError,
} from "@/lib/openbadges/badge-repository";
import { countLearnerBadgeAttempts } from "@/lib/openbadges/badge-earner-attempt";
import { buildOpenBadgeLinkedInShareUrl } from "@/lib/openbadges/linkedin-share";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";
import { awardedBadgeClassIds } from "@/lib/openbadges/badge-assertions";
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
  assertionId?: string | null;
  indexable?: boolean;
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

function parseLevelFromEvaluationConfig(config: unknown): number | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const levelRaw = (config as Record<string, unknown>).level;
  if (typeof levelRaw === "number" && Number.isFinite(levelRaw)) return levelRaw;
  if (typeof levelRaw === "string" && levelRaw.trim()) {
    const parsed = Number.parseInt(levelRaw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Badges où evaluation_config.learnerAwards[userId] existe — sans filtre org. */
async function listOpenBadgeRowsWithAwardForUser(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    level: number | null;
    evaluationConfig: unknown;
  }>
> {
  const uid = userId.trim();
  if (!uid) return [];

  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("open_badges")
    .select("id, name, title, image_url, evaluation_config")
    .contains("evaluation_config", { learnerAwards: { [uid]: {} } })
    .limit(100);

  if (error) {
    console.warn("[learner-visible-badges] earned user scan:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      name?: string | null;
      title?: string | null;
      image_url?: string | null;
      evaluation_config?: unknown;
    };
    const config = r.evaluation_config;
    return {
      id: String(r.id),
      name: String(r.name ?? r.title ?? "").trim() || "Badge",
      imageUrl: r.image_url ?? null,
      level: parseLevelFromEvaluationConfig(config),
      evaluationConfig: config,
    };
  });
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
  const assertionDb = getServiceRoleClient();
  const assertionBadgeIds = assertionDb
    ? await awardedBadgeClassIds(assertionDb, userId)
    : new Set<string>();

  const enriched = rows.map((badge) => {
    const eligible = badge.requiresEnrollment
      ? Boolean(badge.requiredCourseId && enrolledCourseIds.has(badge.requiredCourseId))
      : true;
    const evaluationConfig = configById.get(badge.id);
    const awarded =
      assertionBadgeIds.has(badge.id) || Boolean(getLearnerOpenBadgeAward(evaluationConfig, userId));
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
): Promise<LearnerEarnedOpenBadge[]> {
  const uid = userId.trim();
  if (!uid) return [];

  const supabase = getServiceRoleClient();
  if (supabase) {
    const withIndex = await supabase
      .from("badge_assertions")
      .select("id, badge_class_id, issued_at, indexable")
      .eq("recipient_profile_id", uid);
    const assertions = withIndex.error
      ? (await supabase.from("badge_assertions").select("id, badge_class_id, issued_at").eq("recipient_profile_id", uid)).data
      : withIndex.data;
    if (assertions && assertions.length > 0) {
      const classIds = assertions.map((row) => String(row.badge_class_id));
      const { data: classes } = await supabase
        .from("open_badges")
        .select("id, name, title, image_url, evaluation_config")
        .in("id", classIds);
      const byId = new Map((classes ?? []).map((row) => [String(row.id), row]));
      const earned = assertions.flatMap((assertion) => {
        const badge = byId.get(String(assertion.badge_class_id));
        if (!badge) return [];
        const name = String(badge.name ?? badge.title ?? "").trim() || "Open Badge";
        const shareUrl = getBadgeCriteriaUrl(String(badge.id));
        return [
          {
            id: String(badge.id),
            name,
            imageUrl: (badge.image_url as string | null) ?? null,
            level: parseLevelFromEvaluationConfig(badge.evaluation_config),
            awardedAt: String(assertion.issued_at),
            shareUrl,
            linkedInShareUrl: buildOpenBadgeLinkedInShareUrl({
              shareUrl,
              badgeName: name,
              level: parseLevelFromEvaluationConfig(badge.evaluation_config),
            }),
            assertionId: assertion.id ? String(assertion.id) : null,
            indexable: "indexable" in assertion ? assertion.indexable !== false : true,
          },
        ];
      });
      earned.sort((a, b) => Date.parse(b.awardedAt) - Date.parse(a.awardedAt));
      return earned;
    }
  }

  let rows: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    level: number | null;
    evaluationConfig: unknown;
  }> = [];

  if (canUseOpenBadgesSupabaseRepo()) {
    rows = await listOpenBadgeRowsWithAwardForUser(uid);
  }

  if (rows.length === 0) return [];

  const earned: LearnerEarnedOpenBadge[] = [];

  for (const badge of rows) {
    const award = getLearnerOpenBadgeAward(badge.evaluationConfig, uid);
    if (!award) continue;
    const name = award.badgeName ?? badge.name;
    const shareUrl = getBadgeCriteriaUrl(badge.id);
    earned.push({
      id: badge.id,
      name,
      imageUrl: badge.imageUrl ?? award.imageUrl ?? null,
      level: badge.level,
      awardedAt: award.awardedAt,
      shareUrl,
      linkedInShareUrl: buildOpenBadgeLinkedInShareUrl({
        shareUrl,
        badgeName: name,
        level: badge.level,
      }),
    });
  }

  earned.sort((a, b) => Date.parse(b.awardedAt) - Date.parse(a.awardedAt));
  return earned;
}

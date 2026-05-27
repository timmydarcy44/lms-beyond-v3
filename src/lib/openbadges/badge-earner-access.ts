import {
  canUseOpenBadgesSupabaseRepo,
} from "@/lib/openbadges/badge-repository";
import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import { prisma, resolveAndApplyDatabaseUrl } from "@/lib/prisma";

export function isLearnerVisibleBadgeStatus(raw: unknown): boolean {
  const value = String(raw ?? "").trim().toLowerCase();
  return value === "active" || value === "published";
}

/** Charge un badge actif accessible par l'apprenant (Supabase puis Prisma). */
export async function loadEarnerAccessibleBadgeRow(
  badgeClassId: string,
  orgIds: string[],
): Promise<Record<string, unknown> | null> {
  let badgeRow: Record<string, unknown> | null = null;

  if (canUseOpenBadgesSupabaseRepo()) {
    badgeRow = await getOpenBadgeClassByIdOnly(badgeClassId);
  }

  if (!badgeRow && resolveAndApplyDatabaseUrl()) {
    try {
      const badgeClass = await prisma.badgeClass.findUnique({
        where: { id: badgeClassId },
        select: {
          id: true,
          name: true,
          description: true,
          orgId: true,
          status: true,
          level: true,
          evaluationMethods: true,
          receivability: {
            select: {
              expectedModalities: true,
              methodConfigs: true,
            },
          },
        },
      });
      if (badgeClass) {
        badgeRow = {
          id: badgeClass.id,
          name: badgeClass.name,
          description: badgeClass.description,
          orgId: badgeClass.orgId,
          status: badgeClass.status,
          level: badgeClass.level,
          evaluationMethods: badgeClass.evaluationMethods,
          receivability: badgeClass.receivability,
        };
      }
    } catch (error) {
      console.error("[loadEarnerAccessibleBadgeRow][prisma]", error);
    }
  }

  if (!badgeRow) return null;

  const rowOrg = String(badgeRow.orgId ?? "").trim();
  if (!rowOrg || !orgIds.includes(rowOrg)) return null;
  if (!isLearnerVisibleBadgeStatus(badgeRow.status)) return null;

  return badgeRow;
}

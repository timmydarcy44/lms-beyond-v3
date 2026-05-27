import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import {
  canUseOpenBadgesSupabaseRepo,
  getBadgeClassViaSupabase,
} from "@/lib/openbadges/badge-repository";
import { runFullBadgeEarnerEvaluation } from "@/lib/openbadges/badge-earner-evaluation";
import { resolveBadgeRemediationCourse } from "@/lib/openbadges/badge-remediation";
import { getFailureRemediationCourseId } from "@/lib/openbadges/badge-earner-attempt";
import { prisma, resolveAndApplyDatabaseUrl } from "@/lib/prisma";

type RouteParams = { badgeClassId: string };

function isActiveStatus(raw: unknown): boolean {
  return String(raw ?? "").trim().toLowerCase() === "active";
}

async function loadBadgeRow(badgeClassId: string, orgId: string) {
  let badgeRow: Record<string, unknown> | null = null;

  if (canUseOpenBadgesSupabaseRepo()) {
    badgeRow = await getBadgeClassViaSupabase(badgeClassId, orgId);
    if (!badgeRow) badgeRow = await getBadgeClassViaSupabase(badgeClassId, null);
  }

  if (!badgeRow && resolveAndApplyDatabaseUrl()) {
    const badgeClass = await prisma.badgeClass.findUnique({
      where: { id: badgeClassId },
      select: {
        id: true,
        name: true,
        description: true,
        orgId: true,
        status: true,
        level: true,
        imageUrl: true,
        requiredCourseId: true,
        evaluationMethods: true,
        receivability: { select: { methodConfigs: true, aiEvaluationPrompt: true } },
        evaluationConfig: true,
      },
    });
    if (badgeClass) {
      badgeRow = {
        id: badgeClass.id,
        name: badgeClass.name,
        orgId: badgeClass.orgId,
        status: badgeClass.status,
        level: badgeClass.level,
        imageUrl: badgeClass.imageUrl,
        requiredCourseId: badgeClass.requiredCourseId,
        evaluationMethods: badgeClass.evaluationMethods,
        receivability: badgeClass.receivability,
        evaluation_config: badgeClass.evaluationConfig,
      };
    }
  }

  return badgeRow;
}

async function buildResponse(
  badgeRow: Record<string, unknown>,
  earnerId: string,
  force: boolean,
) {
  const { result } = await runFullBadgeEarnerEvaluation({
    badgeRow,
    earnerId,
    force,
  });

  const remediation = await resolveBadgeRemediationCourse(
    getFailureRemediationCourseId(badgeRow),
  );

  return {
    ok: true,
    result,
    badgeClass: {
      id: badgeRow.id,
      name: badgeRow.name,
      level: result.badgeLevel,
      imageUrl: result.badgeImageUrl,
    },
    remediation: result.awarded ? null : remediation,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = await requireEarnerSession(request);
  if (!auth.ok) return auth.response;

  const { badgeClassId } = await context.params;
  const badgeRow = await loadBadgeRow(badgeClassId, auth.user.orgId);

  if (!badgeRow) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const rowOrg = String(badgeRow.orgId ?? "").trim();
  if (!rowOrg || !auth.orgIds.includes(rowOrg) || !isActiveStatus(badgeRow.status)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  const payload = await buildResponse(badgeRow, auth.user.id, force);
  return NextResponse.json(payload);
}

/** Lance (ou relance) l'évaluation IA complète de la session. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = await requireEarnerSession(request);
  if (!auth.ok) return auth.response;

  const { badgeClassId } = await context.params;
  const badgeRow = await loadBadgeRow(badgeClassId, auth.user.orgId);

  if (!badgeRow) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const rowOrg = String(badgeRow.orgId ?? "").trim();
  if (!rowOrg || !auth.orgIds.includes(rowOrg) || !isActiveStatus(badgeRow.status)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const payload = await buildResponse(badgeRow, auth.user.id, true);
  return NextResponse.json(payload);
}

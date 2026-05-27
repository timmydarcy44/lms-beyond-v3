import { NextRequest, NextResponse } from "next/server";
import { prisma, resolveAndApplyDatabaseUrl } from "@/lib/prisma";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import { AssessmentStatus, EvidenceType } from "@prisma/client";
import { isLearnerEnrolled } from "@/lib/openbadges/enrollment";
import { evaluateIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import {
  canUseOpenBadgesSupabaseRepo,
  getBadgeClassViaSupabase,
} from "@/lib/openbadges/badge-repository";
import {
  getPlaygroundMaxAttempts,
  resolveMethodConfigsForBadge,
} from "@/lib/openbadges/badge-method-config";
import {
  appendOpenBadgeEarnerSubmission,
  countPlaygroundAttemptsInSubmissions,
  getLearnerSubmissionsFromConfig,
  loadOpenBadgeForEarnerSubmit,
} from "@/lib/openbadges/open-badge-earner-submissions";

type RouteParams = { badgeClassId: string };

function isActiveStatus(raw: unknown): boolean {
  const value = String(raw ?? "").trim().toLowerCase();
  return value === "active" || value === "published";
}

function learnerMayAccessBadge(
  badgeRow: Record<string, unknown>,
  orgIds: string[],
): boolean {
  const rowOrg = String(badgeRow.orgId ?? "").trim();
  if (rowOrg && !orgIds.includes(rowOrg)) return false;
  return isActiveStatus(badgeRow.status);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  const auth = await requireEarnerSession(request);
  if (!auth.ok) return auth.response;

  const { badgeClassId } = await params;
  const payload = await request.json();

  let badgeRow: Record<string, unknown> | null = null;

  if (canUseOpenBadgesSupabaseRepo()) {
    badgeRow = await loadOpenBadgeForEarnerSubmit(badgeClassId);
    if (!badgeRow) {
      badgeRow = await getBadgeClassViaSupabase(badgeClassId, auth.user.orgId);
    }
    if (!badgeRow) {
      badgeRow = await getBadgeClassViaSupabase(badgeClassId, null);
    }
  }

  if (!badgeRow && resolveAndApplyDatabaseUrl()) {
    const badgeClass = await prisma.badgeClass.findUnique({
      where: { id: badgeClassId },
      select: {
        id: true,
        orgId: true,
        status: true,
        requiresEnrollment: true,
        requiredCourseId: true,
        receivability: { select: { methodConfigs: true } },
        evaluationMethods: true,
      },
    });
    if (badgeClass) {
      badgeRow = {
        id: badgeClass.id,
        orgId: badgeClass.orgId,
        status: badgeClass.status,
        requiresEnrollment: badgeClass.requiresEnrollment,
        requiredCourseId: badgeClass.requiredCourseId,
        receivability: badgeClass.receivability,
        evaluationMethods: badgeClass.evaluationMethods,
      };
    }
  }

  if (!badgeRow || !learnerMayAccessBadge(badgeRow, auth.orgIds)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const rowOrg = String(badgeRow.orgId ?? auth.user.orgId ?? "").trim() || auth.user.orgId;
  const requiresEnrollment = Boolean(badgeRow.requiresEnrollment);
  const requiredCourseId = badgeRow.requiredCourseId
    ? String(badgeRow.requiredCourseId)
    : null;

  if (requiresEnrollment) {
    if (!requiredCourseId) {
      return NextResponse.json({ error: "ENROLLMENT_REQUIRED" }, { status: 403 });
    }
    const enrolled = await isLearnerEnrolled(auth.user.id, rowOrg, requiredCourseId);
    if (!enrolled) {
      return NextResponse.json({ error: "ENROLLMENT_REQUIRED" }, { status: 403 });
    }
  }

  const integrityMetrics = evaluateIntegrityMetrics(payload?.integrityMetrics);
  const methodResponses = payload?.methodResponses ?? null;

  const methodIdRaw = Array.isArray(methodResponses)
    ? (methodResponses[0] as { methodId?: string })?.methodId
    : null;

  let playgroundUsedBeforeSubmit = 0;

  if (methodIdRaw === "playground") {
    const configs = resolveMethodConfigsForBadge(badgeRow);
    const pg = configs.find((c) => c.methodId === "playground");
    const maxAttempts = pg ? getPlaygroundMaxAttempts(pg) : 2;

    const evaluationConfig =
      badgeRow.evaluation_config ?? badgeRow.evaluationConfig ?? null;
    const existingSubmissions = getLearnerSubmissionsFromConfig(
      evaluationConfig,
      auth.user.id,
    );
    const used = countPlaygroundAttemptsInSubmissions(existingSubmissions);

    playgroundUsedBeforeSubmit = used;

    if (used >= maxAttempts) {
      return NextResponse.json(
        { error: "PLAYGROUND_ATTEMPTS_EXCEEDED", maxAttempts, playgroundAttemptsUsed: used },
        { status: 403 },
      );
    }
  }

  const submissionEntry = {
    methodResponses,
    integrityMetrics,
    evidence: payload?.evidence ?? null,
  };

  const storedInSupabase = await appendOpenBadgeEarnerSubmission(
    badgeClassId,
    auth.user.id,
    submissionEntry,
  );

  if (!resolveAndApplyDatabaseUrl()) {
    if (!storedInSupabase) {
      return NextResponse.json(
        { error: "STORAGE_FAILED", message: "Impossible d'enregistrer la réponse." },
        { status: 503 },
      );
    }
    return NextResponse.json({
      ok: true,
      assessmentId: null,
      stored: true,
      storage: "open_badges",
      playgroundAttemptsUsed:
        methodIdRaw === "playground" ? playgroundUsedBeforeSubmit + 1 : undefined,
    });
  }

  try {
    const existingNeedsInfo = await prisma.assessment.findFirst({
      where: {
        badgeClassId: String(badgeRow.id),
        earnerId: auth.user.id,
        status: AssessmentStatus.NEEDS_INFO,
      },
      orderBy: { updatedAt: "desc" },
    });

    const assessmentData = {
      status: AssessmentStatus.SUBMITTED,
      integrityMetrics,
      methodResponses,
      notes: integrityMetrics.integrityFailed
        ? `[Intégrité] ${integrityMetrics.integrityFailureReasons.join(" ")}`
        : undefined,
    };

    const assessment = existingNeedsInfo
      ? await prisma.assessment.update({
          where: { id: existingNeedsInfo.id },
          data: assessmentData,
        })
      : await prisma.assessment.create({
          data: {
            badgeClassId: String(badgeRow.id),
            earnerId: auth.user.id,
            ...assessmentData,
          },
        });

    if (Array.isArray(payload?.evidence)) {
      const evidenceRows = (payload.evidence as Array<Record<string, unknown>>)
        .map((item) => ({
          assessmentId: assessment.id,
          type: item.type as EvidenceType,
          url: (item.url as string | undefined) ?? null,
          fileKey: (item.fileKey as string | undefined) ?? null,
          mime: (item.mime as string | undefined) ?? null,
          title: (item.title as string | undefined) ?? null,
          description: (item.description as string | undefined) ?? null,
          submittedById: auth.user.id,
        }))
        .filter((item) => Object.values(EvidenceType).includes(item.type));

      if (evidenceRows.length > 0) {
        await prisma.evidence.createMany({ data: evidenceRows });
      }
    }

    return NextResponse.json({
      ok: true,
      assessmentId: assessment.id,
      stored: true,
      playgroundAttemptsUsed:
        methodIdRaw === "playground" ? playgroundUsedBeforeSubmit + 1 : undefined,
    });
  } catch (prismaErr) {
    if (storedInSupabase) {
      return NextResponse.json({
        ok: true,
        assessmentId: null,
        stored: true,
        storage: "open_badges",
        prismaFallback: true,
      });
    }
    console.error("[earner][badge-submit]", prismaErr);
    return NextResponse.json(
      { error: "SUBMIT_FAILED", message: "Enregistrement impossible." },
      { status: 500 },
    );
  }
}

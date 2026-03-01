import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { AssessmentStatus, EvidenceType, UserRole } from "@prisma/client";
import { isLearnerEnrolled } from "@/lib/openbadges/enrollment";

type RouteParams = { badgeClassId: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = requireRole(request, [UserRole.EARNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const { badgeClassId } = await context.params;
  const payload = await request.json();

  const badgeClass = await prisma.badgeClass.findUnique({
    where: { id: badgeClassId },
    select: {
      id: true,
      orgId: true,
      status: true,
      requiresEnrollment: true,
      requiredCourseId: true,
    },
  });

  if (!badgeClass || badgeClass.orgId !== auth.user.orgId || badgeClass.status !== "ACTIVE") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (badgeClass.requiresEnrollment) {
    if (!badgeClass.requiredCourseId) {
      return NextResponse.json({ error: "ENROLLMENT_REQUIRED" }, { status: 403 });
    }
    const enrolled = await isLearnerEnrolled(
      auth.user.id,
      auth.user.orgId,
      badgeClass.requiredCourseId,
    );
    if (!enrolled) {
      return NextResponse.json({ error: "ENROLLMENT_REQUIRED" }, { status: 403 });
    }
  }

  const existingNeedsInfo = await prisma.assessment.findFirst({
    where: {
      badgeClassId: badgeClass.id,
      earnerId: auth.user.id,
      status: AssessmentStatus.NEEDS_INFO,
    },
    orderBy: { updatedAt: "desc" },
  });

  const assessment = existingNeedsInfo
    ? await prisma.assessment.update({
        where: { id: existingNeedsInfo.id },
        data: { status: AssessmentStatus.SUBMITTED },
      })
    : await prisma.assessment.create({
        data: {
          badgeClassId: badgeClass.id,
          earnerId: auth.user.id,
          status: AssessmentStatus.SUBMITTED,
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

  return NextResponse.json({ ok: true, assessmentId: assessment.id });
}

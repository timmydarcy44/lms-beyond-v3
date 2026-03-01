import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { issueBadge } from "@/lib/openbadges/issue";
import { getBaseUrl } from "@/lib/openbadges/urls";
import { AssessmentStatus, UserRole } from "@prisma/client";

type RouteParams = { assessmentId: string };

const allowedStatuses: AssessmentStatus[] = ["NEEDS_INFO", "REJECTED", "APPROVED"];

const canTransition = (current: AssessmentStatus, next: AssessmentStatus) => {
  if (current === "REJECTED") return false;
  if (current === "SUBMITTED") {
    return ["NEEDS_INFO", "REJECTED", "APPROVED"].includes(next);
  }
  if (current === "NEEDS_INFO") {
    return ["REJECTED", "APPROVED"].includes(next);
  }
  return false;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const { assessmentId } = await context.params;
  const payload = await request.json();
  const status = payload?.status as AssessmentStatus;
  const note = typeof payload?.note === "string" ? payload.note.trim() : "";

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }
  if (status === "NEEDS_INFO" && note.length === 0) {
    return NextResponse.json({ error: "NOTE_REQUIRED" }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      badgeClass: { select: { orgId: true } },
      assertions: { select: { id: true }, orderBy: { issuedOn: "desc" } },
    },
  });

  if (!assessment || assessment.badgeClass.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (assessment.assertions.length > 0) {
    return NextResponse.json({ error: "ALREADY_ISSUED" }, { status: 409 });
  }

  if (!canTransition(assessment.status, status)) {
    return NextResponse.json({ error: "INVALID_TRANSITION" }, { status: 409 });
  }

  if (status === "APPROVED") {
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        status: "APPROVED",
        notes: note.length > 0 ? note : null,
        decisionAt: new Date(),
      },
    });

    const issued = await issueBadge(request, assessment.id);
    const baseUrl = getBaseUrl();
    const assertionId = issued.assertionId;
    const assertionUrl = issued.hostedUrl ?? `${baseUrl}/api/public/assertions/${assertionId}`;
    const downloadUrl = `${baseUrl}/api/public/assertions/${assertionId}/download`;

    return NextResponse.json({
      ok: true,
      status: "ISSUED",
      assertionId,
      assertionUrl,
      downloadUrl,
    });
  }

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      status,
      notes: note.length > 0 ? note : null,
      decisionAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, status, note: note.length > 0 ? note : null });
}

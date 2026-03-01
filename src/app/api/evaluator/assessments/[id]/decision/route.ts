import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { AssessmentStatus, UserRole } from "@prisma/client";

type AssessmentDecisionStatus = "APPROVED" | "REJECTED" | "NEEDS_INFO";

type RouteParams = { id: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = requireRole(request, [UserRole.EVALUATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const { id } = await context.params;
  const status = payload.status as AssessmentDecisionStatus;
  const allowedStatuses: readonly AssessmentDecisionStatus[] = [
    "APPROVED",
    "REJECTED",
    "NEEDS_INFO",
  ];

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const assessment = await prisma.assessment.update({
    where: { id },
    data: {
      status,
      decisionAt: new Date(),
      notes: payload.notes ?? null,
      evaluatorId: auth.user.id,
    },
  });

  return NextResponse.json({ ok: true, assessment });
}

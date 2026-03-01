import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";

type RouteParams = { badgeClassId: string };

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = requireRole(request, [UserRole.EARNER]);
  if (!auth.ok) return auth.response;

  const { badgeClassId } = await context.params;

  const assessment = await prisma.assessment.findFirst({
    where: {
      badgeClassId,
      earnerId: auth.user.id,
      badgeClass: { orgId: auth.user.orgId },
    },
    include: {
      evidence: {
        select: { type: true, url: true, title: true, description: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!assessment) {
    return NextResponse.json({ ok: true, item: null });
  }

  return NextResponse.json({
    ok: true,
    item: {
      assessmentId: assessment.id,
      status: assessment.status,
      note: assessment.notes ?? null,
      evidences: assessment.evidence.map((evidence) => ({
        type: evidence.type,
        url: evidence.url ?? null,
        title: evidence.title ?? null,
        description: evidence.description ?? null,
        createdAt: evidence.createdAt.toISOString(),
      })),
    },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";
import { getBaseUrl } from "@/lib/openbadges/urls";

const normalizeStatus = (status: string, issued: boolean) => {
  if (issued) return "ISSUED";
  if (status === "DRAFT") return "SUBMITTED";
  return status;
};

export async function GET(request: Request) {
  const auth = requireRole(request, [UserRole.EARNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const assessments = await prisma.assessment.findMany({
    where: {
      earnerId: auth.user.id,
      badgeClass: { orgId: auth.user.orgId },
    },
    include: {
      badgeClass: {
        select: { id: true, name: true, imageUrl: true, imageTemplateUrl: true },
      },
      assertions: {
        select: { id: true, hostedUrl: true },
        orderBy: { issuedOn: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const baseUrl = getBaseUrl();
  const items = assessments.map((assessment) => {
    const assertion = assessment.assertions[0];
    const assertionId = assertion?.id ?? null;
    const assertionUrl =
      assertionId ? assertion.hostedUrl ?? `${baseUrl}/api/public/assertions/${assertionId}` : null;
    return {
      assessmentId: assessment.id,
      badgeClass: {
        id: assessment.badgeClass.id,
        name: assessment.badgeClass.name,
        imageUrl: assessment.badgeClass.imageUrl ?? assessment.badgeClass.imageTemplateUrl,
      },
      status: normalizeStatus(assessment.status, Boolean(assertionId)),
      lastUpdatedAt: assessment.updatedAt.toISOString(),
      note: assessment.notes ?? null,
      assertionId,
      assertionUrl,
      downloadUrl: assertionId
        ? `${baseUrl}/api/public/assertions/${assertionId}/download`
        : null,
    };
  });

  return NextResponse.json({ ok: true, items });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";
import { getBaseUrl } from "@/lib/openbadges/urls";

type RouteParams = { assessmentId: string };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = requireRole(_request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const { assessmentId } = await context.params;
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      badgeClass: {
        include: {
          issuer: { select: { name: true, url: true, imageUrl: true } },
          receivability: true,
          criteria: { orderBy: { sortOrder: "asc" } },
        },
      },
      earner: { select: { id: true, name: true } },
      evidence: {
        select: { type: true, url: true, title: true, description: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      assertions: { select: { id: true, hostedUrl: true }, orderBy: { issuedOn: "desc" } },
    },
  });

  if (!assessment || assessment.badgeClass.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const baseUrl = getBaseUrl();
  const assertion = assessment.assertions[0];
  const assertionId = assertion?.id ?? null;
  const assertionUrl = assertionId
    ? assertion?.hostedUrl ?? `${baseUrl}/api/public/assertions/${assertionId}`
    : null;

  return NextResponse.json({
    ok: true,
    assessment: {
      id: assessment.id,
      status: assessment.status,
      notes: assessment.notes ?? null,
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
    },
    earner: {
      id: assessment.earner.id,
      displayName: assessment.earner.name ?? null,
    },
    badgeClass: {
      id: assessment.badgeClass.id,
      name: assessment.badgeClass.name,
      description: assessment.badgeClass.description,
      imageUrl: assessment.badgeClass.imageUrl ?? assessment.badgeClass.imageTemplateUrl,
      criteriaMarkdown: assessment.badgeClass.criteriaMarkdown ?? "",
      criteriaUrl: assessment.badgeClass.criteriaUrl ?? null,
      issuerProfile: assessment.badgeClass.issuer,
      requiresEnrollment: assessment.badgeClass.requiresEnrollment,
      requiredCourseId: assessment.badgeClass.requiredCourseId ?? null,
    },
    receivability: assessment.badgeClass.receivability
      ? {
          expectedModalities: assessment.badgeClass.receivability.expectedModalities,
          aiEvaluationPrompt: assessment.badgeClass.receivability.aiEvaluationPrompt,
        }
      : null,
    criteria: assessment.badgeClass.criteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      description: criterion.description ?? null,
      sortOrder: criterion.sortOrder,
    })),
    evidences: assessment.evidence.map((evidence) => ({
      type: evidence.type,
      url: evidence.url ?? null,
      title: evidence.title ?? null,
      description: evidence.description ?? null,
      createdAt: evidence.createdAt.toISOString(),
    })),
    issued: assertionId
      ? {
          assertionId,
          assertionUrl,
          downloadUrl: `${baseUrl}/api/public/assertions/${assertionId}/download`,
        }
      : null,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { BadgeClassStatus, ReceivabilityReviewMode, UserRole } from "@prisma/client";
import { getBaseUrl } from "@/lib/openbadges/urls";

const resolveIssuerForOrg = async (orgId: string) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, slug: true },
  });
  if (!org) return null;

  const existing = await prisma.issuerProfile.findFirst({
    where: {
      orgId,
      name: { equals: org.name, mode: "insensitive" },
    },
  });
  if (existing) return existing;

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = org.slug ? `${baseUrl}/org/${org.slug}` : baseUrl;
  const email = org.slug ? `contact@${org.slug}.local` : "contact@invalid.local";

  return prisma.issuerProfile.create({
    data: {
      orgId,
      name: org.name,
      url,
      email,
      description: `Émetteur organisation ${org.name}.`,
      imageUrl: null,
    },
  });
};

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const badgeClass = await prisma.badgeClass.findUnique({
    where: { id },
    include: {
      issuer: true,
      criteria: { orderBy: { sortOrder: "asc" } },
      receivability: true,
    },
  });
  if (!badgeClass || badgeClass.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, badgeClass });
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const { id } = await params;
  const receivabilityReviewMode = payload.receivabilityReviewMode as ReceivabilityReviewMode | undefined;
  const payloadOrgId = typeof payload.organizationId === "string" ? payload.organizationId.trim() : null;
  const hasRequiresEnrollment = Object.prototype.hasOwnProperty.call(payload, "requiresEnrollment");
  const hasRequiredCourseId = Object.prototype.hasOwnProperty.call(payload, "requiredCourseId");
  const requiresEnrollment = hasRequiresEnrollment ? Boolean(payload.requiresEnrollment) : undefined;
  const requiredCourseId =
    hasRequiredCourseId && typeof payload.requiredCourseId === "string" && payload.requiredCourseId.trim().length > 0
      ? payload.requiredCourseId.trim()
      : hasRequiredCourseId
        ? null
        : undefined;
  const existing = await prisma.badgeClass.findUnique({
    where: { id },
    select: { orgId: true },
  });
  if (!existing || existing.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (payloadOrgId && payloadOrgId !== existing.orgId) {
    return NextResponse.json({ error: "ORG_MISMATCH" }, { status: 400 });
  }
  if (requiresEnrollment === true && !requiredCourseId) {
    return NextResponse.json({ error: "REQUIRED_COURSE_MISSING" }, { status: 400 });
  }
  if (requiresEnrollment === false && requiredCourseId) {
    return NextResponse.json({ error: "REQUIRED_COURSE_NOT_ALLOWED" }, { status: 400 });
  }
  if (
    receivabilityReviewMode
    && !Object.values(ReceivabilityReviewMode).includes(receivabilityReviewMode)
  ) {
    return NextResponse.json({ error: "INVALID_REVIEW_MODE" }, { status: 400 });
  }
  if (
    (receivabilityReviewMode === ReceivabilityReviewMode.AI
      || receivabilityReviewMode === ReceivabilityReviewMode.MIXED)
    && (!payload.receivability?.aiEvaluationPrompt || payload.receivability.aiEvaluationPrompt.trim().length === 0)
  ) {
    return NextResponse.json({ error: "AI_PROMPT_REQUIRED" }, { status: 400 });
  }
  const issuer = await resolveIssuerForOrg(existing.orgId);
  if (!issuer) {
    return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 400 });
  }

  const badgeClass = await prisma.$transaction(async (tx) => {
    const shouldUpdateCriteriaUrl = Object.prototype.hasOwnProperty.call(payload, "criteriaUrl");
    const updated = await tx.badgeClass.update({
      where: { id },
      data: {
        issuerId: issuer.id,
        name: payload.name ?? undefined,
        description: payload.description ?? undefined,
        imageTemplateUrl: payload.imageUrl ?? payload.imageTemplateUrl ?? undefined,
        imageUrl: payload.imageUrl ?? undefined,
        criteriaUrl: shouldUpdateCriteriaUrl ? payload.criteriaUrl ?? null : undefined,
        criteriaText: payload.criteriaText ?? null,
        criteriaMarkdown: payload.criteriaMarkdown ?? null,
        alignment: payload.alignment ?? null,
        tags: payload.tags ?? undefined,
        version: payload.version ?? undefined,
        status: payload.status ? (payload.status as BadgeClassStatus) : undefined,
        receivabilityReviewMode: receivabilityReviewMode ?? undefined,
        requiresEnrollment: requiresEnrollment ?? undefined,
        requiredCourseId:
          requiresEnrollment === false
            ? null
            : requiredCourseId ?? undefined,
      },
    });

    if (Array.isArray(payload.criteria)) {
      await tx.badgeCriteria.deleteMany({ where: { badgeClassId: id } });
      if (payload.criteria.length > 0) {
        await tx.badgeCriteria.createMany({
          data: payload.criteria.map((criterion: any) => ({
            badgeClassId: id,
            label: criterion.label,
            description: criterion.description ?? null,
            sortOrder: Number(criterion.sortOrder ?? 0),
          })),
        });
      }
    }

    if (payload.receivability) {
      await tx.badgeReceivability.upsert({
        where: { badgeClassId: id },
        create: {
          badgeClassId: id,
          expectedModalities: payload.receivability.expectedModalities,
          aiEvaluationPrompt: payload.receivability.aiEvaluationPrompt,
        },
        update: {
          expectedModalities: payload.receivability.expectedModalities,
          aiEvaluationPrompt: payload.receivability.aiEvaluationPrompt,
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ ok: true, badgeClass });
}

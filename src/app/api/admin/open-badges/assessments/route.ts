import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { AssessmentStatus, UserRole } from "@prisma/client";
import { getBaseUrl } from "@/lib/openbadges/urls";

const allowedStatuses = new Set([
  "SUBMITTED",
  "NEEDS_INFO",
  "REJECTED",
  "ISSUED",
]);

export async function GET(request: Request) {
  const auth = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const badgeClassId = url.searchParams.get("badgeClassId");
  const earnerId = url.searchParams.get("earnerId");
  const q = url.searchParams.get("q")?.trim();
  const cursor = url.searchParams.get("cursor");
  const limitParam = url.searchParams.get("limit");
  const includeTotalParam = url.searchParams.get("includeTotal");
  const includeTotal = includeTotalParam === "true";
  const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 50);

  if (statusParam && !allowedStatuses.has(statusParam)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const where: any = {
    badgeClass: { orgId: auth.user.orgId },
  };

  if (badgeClassId) {
    where.badgeClassId = badgeClassId;
  }
  if (earnerId) {
    where.earnerId = earnerId;
  }
  if (statusParam && statusParam !== "ISSUED") {
    where.status = statusParam as AssessmentStatus;
  }
  if (statusParam === "ISSUED") {
    where.assertions = { some: {} };
  }
  if (q) {
    where.OR = [
      { badgeClass: { name: { contains: q, mode: "insensitive" } } },
      { earner: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const assessments = await prisma.assessment.findMany({
    where,
    include: {
      badgeClass: {
        select: { id: true, name: true, imageUrl: true, imageTemplateUrl: true },
      },
      earner: { select: { id: true, name: true } },
      assertions: { select: { id: true, issuedOn: true }, orderBy: { issuedOn: "desc" } },
      _count: { select: { evidence: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });

  const baseUrl = getBaseUrl();
  const totalCount = includeTotal
    ? await prisma.assessment.count({ where })
    : undefined;
  const hasNext = assessments.length > limit;
  const sliced = hasNext ? assessments.slice(0, limit) : assessments;
  const nextCursor = hasNext ? sliced[sliced.length - 1]?.id ?? null : null;

  const items = sliced.map((assessment) => {
    const assertion = assessment.assertions[0];
    const issued = Boolean(assertion?.id);
    return {
      assessmentId: assessment.id,
      status: issued ? "ISSUED" : assessment.status,
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
      earner: {
        id: assessment.earner.id,
        displayName: assessment.earner.name ?? null,
      },
      badgeClass: {
        id: assessment.badgeClass.id,
        name: assessment.badgeClass.name,
        imageUrl: assessment.badgeClass.imageUrl ?? assessment.badgeClass.imageTemplateUrl,
      },
      evidenceCount: assessment._count.evidence,
      issued: assertion?.id
        ? {
            assertionId: assertion.id,
            assertionUrl: `${baseUrl}/api/public/assertions/${assertion.id}`,
          }
        : null,
    };
  });

  return NextResponse.json({ ok: true, items, nextCursor, totalCount });
}

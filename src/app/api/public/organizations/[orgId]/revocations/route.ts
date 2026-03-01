import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const withCors = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
};

type RouteParams = { orgId: string };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const { orgId } = await context.params;
  const revokedAssertions = await prisma.assertion.findMany({
    where: {
      revokedAt: { not: null },
      badgeClass: { orgId },
    },
    select: {
      id: true,
      revokedAt: true,
      revocationReason: true,
    },
    orderBy: { revokedAt: "desc" },
  });

  const response = NextResponse.json({
    organizationId: orgId,
    generatedAt: new Date().toISOString(),
    revocations: revokedAssertions.map((revocation) => ({
      assertionId: revocation.id,
      revokedAt: revocation.revokedAt?.toISOString() ?? null,
      reason: revocation.revocationReason ?? null,
    })),
  });
  response.headers.set(
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
  );
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

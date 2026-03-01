import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAssertion } from "@/lib/openbadges/v2/builders";
import { getBaseUrl } from "@/lib/openbadges/urls";

const withCors = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
};

type RouteParams = { assertionId: string };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const { assertionId } = await context.params;
  const assertion = await prisma.assertion.findUnique({
    where: { id: assertionId },
    include: {
      badgeClass: true,
      issuer: true,
      earner: true,
    },
  });

  if (!assertion) {
    return withCors(NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }));
  }

  const baseUrl = getBaseUrl();
  const hostedUrl =
    assertion.hostedUrl ?? `${baseUrl}/api/public/assertions/${assertion.id}`;

  const evidence =
    Array.isArray(assertion.evidenceRefs)
      ? assertion.evidenceRefs
          .map((evidenceRef: any) => ({
            id: evidenceRef?.id,
            narrative: evidenceRef?.narrative ?? undefined,
          }))
          .filter((evidenceRef: any) => Boolean(evidenceRef.id))
      : [];

  const jsonld = buildAssertion({
    id: hostedUrl,
    badgeClassId: `${baseUrl}/api/public/badgeclasses/${assertion.badgeClassId}`,
    issuerId: `${baseUrl}/api/public/issuers/${assertion.issuerId}`,
    recipientEmail: assertion.earner.email,
    recipientSalt: assertion.recipientSalt,
    issuedOn: assertion.issuedOn,
    expires: assertion.expires,
    evidenceUrls: evidence.map((item: any) => item.id),
    verification: { type: "hosted", url: hostedUrl },
    version: assertion.badgeClass.version,
    revoked: assertion.revoked,
    revocationReason: assertion.revocationReason,
  });
  if (assertion.revokedAt) {
    jsonld.revoked = true;
    jsonld.revocationReason = assertion.revocationReason ?? undefined;
    jsonld.revokedAt = assertion.revokedAt.toISOString();
  }
  if (evidence.length > 0) {
    jsonld.evidence = evidence;
  }

  const response = NextResponse.json(jsonld);
  response.headers.set("Content-Type", "application/ld+json; charset=utf-8");
  response.headers.set(
    "Cache-Control",
    "public, max-age=60, s-maxage=600, stale-while-revalidate=86400",
  );
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

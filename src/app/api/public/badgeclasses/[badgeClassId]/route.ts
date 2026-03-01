import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBadgeClassJsonLd } from "@/lib/openbadges/v2/builders";
import { getBaseUrl } from "@/lib/openbadges/urls";

const withCors = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
};

type RouteParams = { badgeClassId: string };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const { badgeClassId } = await context.params;
  const badgeClass = await prisma.badgeClass.findUnique({
    where: { id: badgeClassId },
  });

  if (!badgeClass) {
    return withCors(NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }));
  }

  const baseUrl = getBaseUrl();
  const jsonld = buildBadgeClassJsonLd({
    baseUrl,
    badgeClass,
  });

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

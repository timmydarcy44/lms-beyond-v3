import { NextRequest, NextResponse } from "next/server";
import { loadPublicBadgeClass } from "@/lib/openbadges/public-badge-class";
import { byoundIssuerId } from "@/lib/openbadges/public-issuer";
import { getPublicShareBaseUrl } from "@/lib/openbadges/urls";

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
  const badge = await loadPublicBadgeClass(badgeClassId);
  if (!badge) {
    return withCors(NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }));
  }

  const base = getPublicShareBaseUrl();
  const narrative =
    badge.criteriaMarkdown.trim() ||
    badge.structuredCriteria.map((item) => item.label).filter(Boolean).join("\n");

  const response = NextResponse.json({
    id: `${base}/badgeclasses/${badge.id}`,
    type: "BadgeClass",
    name: badge.name,
    description: badge.description,
    image: badge.imageUrl,
    criteria: {
      narrative,
      items: badge.structuredCriteria.map((item) => ({
        label: item.label,
        description: item.description,
      })),
    },
    issuer: byoundIssuerId(base),
  });
  response.headers.set("Content-Type", "application/json; charset=utf-8");
  response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

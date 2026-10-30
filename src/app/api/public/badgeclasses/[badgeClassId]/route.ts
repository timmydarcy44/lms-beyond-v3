import { NextRequest, NextResponse } from "next/server";
import { loadPublicBadgeClass } from "@/lib/openbadges/public-badge-class";
import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";

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

  const narrative =
    badge.criteriaMarkdown.trim() ||
    badge.structuredCriteria
      .map((item) => [item.label, item.description].filter(Boolean).join(" — "))
      .filter(Boolean)
      .join("\n");
  const id = `${BADGE_PUBLIC_ORIGIN}/badgeclasses/${badge.id}`;

  const response = NextResponse.json({
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id,
    type: ["Achievement"],
    achievementType: "Competency",
    name: badge.name,
    description: badge.description,
    criteria: { id: `${id}/criteria`, narrative },
    ...(badge.imageUrl ? { image: { id: badge.imageUrl, type: "Image" } } : {}),
    creator: {
      id: `${BADGE_PUBLIC_ORIGIN}/issuers/byound`,
      type: ["Profile"],
      name: "Byound",
      url: BADGE_PUBLIC_ORIGIN,
    },
  });
  response.headers.set("Content-Type", "application/json; charset=utf-8");
  response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

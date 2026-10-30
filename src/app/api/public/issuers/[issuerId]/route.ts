import { NextRequest, NextResponse } from "next/server";
import { loadPublicIssuer } from "@/lib/openbadges/public-issuer";

const withCors = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
};

type RouteParams = { issuerId: string };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const { issuerId } = await context.params;
  const issuer = loadPublicIssuer(issuerId);
  if (!issuer) {
    return withCors(NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }));
  }

  const response = NextResponse.json(issuer);
  response.headers.set("Content-Type", "application/json; charset=utf-8");
  response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

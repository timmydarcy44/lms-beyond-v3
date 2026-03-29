import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIssuerProfile } from "@/lib/openbadges/v2/builders";

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
  const issuer = await prisma.issuerProfile.findUnique({
    where: { id: issuerId },
  });

  if (!issuer) {
    return withCors(NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }));
  }

  const jsonld = buildIssuerProfile({
    id: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001"}/api/public/issuers/${issuer.id}`,
    name: issuer.name,
    url: issuer.url,
    email: issuer.email,
    description: issuer.description,
    image: issuer.imageUrl,
    publicKey: (issuer.publicKeys as any) ?? undefined,
  });

  const response = NextResponse.json(jsonld);
  response.headers.set("Content-Type", "application/ld+json; charset=utf-8");
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

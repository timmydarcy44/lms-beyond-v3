import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    select: { hostedUrl: true, bakedImageUrl: true },
  });

  if (!assertion) {
    return withCors(NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }));
  }

  const baseUrl = getBaseUrl();
  const assertionUrl =
    assertion.hostedUrl ?? `${baseUrl}/api/public/assertions/${assertionId}`;

  if (assertion.bakedImageUrl && assertion.bakedImageUrl.startsWith(baseUrl)) {
    const response = await fetch(assertion.bakedImageUrl);
    if (response.ok) {
      const contentType = response.headers.get("Content-Type") ?? "image/png";
      const buffer = Buffer.from(await response.arrayBuffer());
      const downloadResponse = new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="badge-${assertionId}.png"`,
        },
      });
      return withCors(downloadResponse);
    }
  }

  return withCors(
    NextResponse.json({
      assertionUrl,
      bakedImageUrl: assertion.bakedImageUrl ?? null,
    }),
  );
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

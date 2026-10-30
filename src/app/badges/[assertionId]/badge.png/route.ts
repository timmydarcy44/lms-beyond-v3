import { NextRequest, NextResponse } from "next/server";
import { bakePng } from "@/lib/openbadges/baking/png";
import { loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { assertionId: string };

export async function GET(_request: NextRequest, context: { params: Promise<RouteParams> }) {
  const { assertionId } = await context.params;
  const db = getServiceRoleClient();
  if (!db) return new NextResponse("Not found", { status: 404 });
  const badge = await loadPublicBadgeDocument(db, assertionId);
  if (!badge?.imageUrl) return new NextResponse("Not found", { status: 404 });

  const image = await fetch(badge.imageUrl);
  if (!image.ok) return new NextResponse("Not found", { status: 404 });
  const bytes = Buffer.from(await image.arrayBuffer());
  let baked: Buffer;
  try {
    baked = bakePng(bytes, badge.credentialJwt);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(baked), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="badge.png"',
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}

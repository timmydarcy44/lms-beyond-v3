import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";

type RouteParams = { assertionId: string };

export async function GET(_request: NextRequest, context: { params: Promise<RouteParams> }) {
  const { assertionId } = await context.params;
  const db = getServiceRoleClient();
  if (!db) return new NextResponse("Not found", { status: 404 });
  const badge = await loadPublicBadgeDocument(db, assertionId);
  if (!badge) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(badge.credentialJwt, {
    headers: {
      "Content-Type": "application/jwt; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}

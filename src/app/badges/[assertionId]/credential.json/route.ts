import { NextResponse } from "next/server";
import { decodeCredentialPayload, loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ assertionId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  const payload = badge ? decodeCredentialPayload(badge.credentialJwt) : null;
  if (!payload) return new NextResponse("Introuvable", { status: 404 });
  return NextResponse.json(payload, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}

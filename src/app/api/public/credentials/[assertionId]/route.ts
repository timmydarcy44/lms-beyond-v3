import { NextRequest } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { decodeCredentialPayload, loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";
import { publicCorsPreflight, publicJson } from "@/lib/openbadges/v3/public-json";

type RouteParams = { assertionId: string };

export async function GET(_request: NextRequest, context: { params: Promise<RouteParams> }) {
  const { assertionId } = await context.params;
  const db = getServiceRoleClient();
  if (!db) return publicJson({ error: "NOT_FOUND" }, 404);
  const badge = await loadPublicBadgeDocument(db, assertionId);
  if (!badge) return publicJson({ error: "NOT_FOUND" }, 404);
  const credential = decodeCredentialPayload(badge.credentialJwt);
  if (!credential) return publicJson({ error: "NOT_FOUND" }, 404);
  return publicJson(credential);
}

export function OPTIONS() {
  return publicCorsPreflight();
}

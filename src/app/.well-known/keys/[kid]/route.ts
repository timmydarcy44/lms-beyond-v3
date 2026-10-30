import { NextResponse } from "next/server";
import { findPublicJwk, publicJwksKeys, publishedJwk } from "@/lib/openbadges/v3/sign";
import { getServiceRoleClient } from "@/lib/supabase/server";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

export async function GET(_request: Request, context: { params: Promise<{ kid: string }> }) {
  const { kid } = await context.params;
  const db = getServiceRoleClient();
  const { data } = db
    ? await db.from("badge_issuers").select("public_jwks").eq("slug", "byound").maybeSingle()
    : { data: null };
  const keys = publicJwksKeys(data?.public_jwks?.keys);
  const match = findPublicJwk(keys, kid);
  const body = match ? publishedJwk(match) : null;
  if (!body) return new NextResponse("Not found", { status: 404, headers: HEADERS });
  return new NextResponse(JSON.stringify(body), {
    headers: { ...HEADERS, "Content-Type": "application/jwk+json" },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { signCredentialJwt } from "@/lib/openbadges/v3/sign";
import { statusListCredential } from "@/lib/openbadges/v3/public-badge";
import { refreshRevocationList } from "@/lib/openbadges/v3/revocation";
import { publicCorsPreflight, publicJson } from "@/lib/openbadges/v3/public-json";

export async function GET() {
  const db = getServiceRoleClient();
  if (!db) return publicJson({ error: "NOT_FOUND" }, 404);
  const encodedList = await refreshRevocationList(db);
  const credential = statusListCredential(encodedList, new Date().toISOString());
  const signed = await signCredentialJwt(credential);
  if (!signed) return publicJson({ error: "SIGNING_UNAVAILABLE" }, 503);
  return new NextResponse(signed.jwt, {
    headers: {
      "Content-Type": "application/jwt; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}

export function OPTIONS() {
  return publicCorsPreflight();
}

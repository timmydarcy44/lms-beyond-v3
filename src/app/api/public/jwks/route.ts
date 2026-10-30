import { getServiceRoleClient } from "@/lib/supabase/server";
import { publicCorsPreflight, publicJson } from "@/lib/openbadges/v3/public-json";
import { publicJwksKeys } from "@/lib/openbadges/v3/sign";

export async function GET() {
  const db = getServiceRoleClient();
  const { data } = db
    ? await db.from("badge_issuers").select("public_jwks").eq("slug", "byound").maybeSingle()
    : { data: null };
  const keys = publicJwksKeys(data?.public_jwks?.keys);
  return publicJson({ keys });
}

export function OPTIONS() {
  return publicCorsPreflight();
}

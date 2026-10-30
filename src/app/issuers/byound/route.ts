import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";
import { publicCorsPreflight, publicJson } from "@/lib/openbadges/v3/public-json";
import { publicJwksKeys } from "@/lib/openbadges/v3/sign";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const db = getServiceRoleClient();
  const { data } = db
    ? await db.from("badge_issuers").select("name, url, email, description, image_url, public_jwks").eq("slug", "byound").maybeSingle()
    : { data: null };
  const keys = publicJwksKeys(data?.public_jwks?.keys);
  return publicJson({
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: `${BADGE_PUBLIC_ORIGIN}/issuers/byound`,
    type: ["Profile"],
    name: data?.name ?? "Byound",
    url: data?.url ?? BADGE_PUBLIC_ORIGIN,
    email: data?.email ?? "contact@byound.fr",
    description: data?.description ?? "Byound délivre des Open Badges qui attestent des compétences.",
    ...(data?.image_url ? { image: { id: data.image_url, type: "Image" } } : {}),
    publicKey: keys,
  });
}

export function OPTIONS() {
  return publicCorsPreflight();
}

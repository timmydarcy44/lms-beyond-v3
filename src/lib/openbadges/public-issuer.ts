import { getPublicShareBaseUrl } from "@/lib/openbadges/urls";

export const BYOUND_ISSUER_SLUG = "byound";

export type PublicIssuerView = {
  id: string;
  type: "Profile";
  name: string;
  url: string;
  email: string;
  description: string;
};

export function byoundIssuerId(baseUrl = getPublicShareBaseUrl()): string {
  return `${baseUrl.replace(/\/$/, "")}/issuers/${BYOUND_ISSUER_SLUG}`;
}

export function loadPublicIssuer(issuerId: string): PublicIssuerView | null {
  const key = issuerId.trim().toLowerCase();
  if (key !== BYOUND_ISSUER_SLUG && key !== "byound-issuer") return null;
  const base = getPublicShareBaseUrl();
  return {
    id: byoundIssuerId(base),
    type: "Profile",
    name: "Byound",
    url: base,
    email: "contact@byound.fr",
    description: "Byound délivre des Open Badges qui attestent des compétences, sans publier les résultats des tests.",
  };
}

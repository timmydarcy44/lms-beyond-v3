/**
 * URLs campagne communication — jeunes / alternance Byound School.
 *
 * Landing principale : /ecole
 * Conversion directe : /ecole/candidater
 *
 * Exemples UTM (à coller dans Meta / Google / partenaires) :
 * - https://edgebs.fr/ecole?utm_source=meta&utm_medium=paid&utm_campaign=alternance_2026
 * - https://edgebs.fr/ecole/candidater?utm_source=meta&utm_medium=paid&utm_campaign=alternance_2026
 * - https://edgebs.fr/ecole/ntc/ai-business?utm_source=meta&utm_medium=paid&utm_campaign=alternance_2026
 * - https://edgebs.fr/ecole/mem/retail-experience?utm_source=meta&utm_medium=paid&utm_campaign=alternance_2026
 *
 * Ne pas envoyer la campagne sur la home ni sur « Créer un compte » entreprise.
 */

export const CAMPAIGN_SCHOOL_LANDING = "/ecole";
export const CAMPAIGN_SCHOOL_APPLY = "/ecole/candidater";

export function campaignSchoolLandingUrl(params?: {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  baseOrigin?: string;
}): string {
  const origin = (params?.baseOrigin ?? "https://edgebs.fr").replace(/\/$/, "");
  const url = new URL(`${origin}${CAMPAIGN_SCHOOL_LANDING}`);
  if (params?.utm_source) url.searchParams.set("utm_source", params.utm_source);
  if (params?.utm_medium) url.searchParams.set("utm_medium", params.utm_medium);
  if (params?.utm_campaign) url.searchParams.set("utm_campaign", params.utm_campaign);
  return url.toString();
}

export function campaignSchoolApplyUrl(params?: {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  baseOrigin?: string;
}): string {
  const origin = (params?.baseOrigin ?? "https://edgebs.fr").replace(/\/$/, "");
  const url = new URL(`${origin}${CAMPAIGN_SCHOOL_APPLY}`);
  if (params?.utm_source) url.searchParams.set("utm_source", params.utm_source);
  if (params?.utm_medium) url.searchParams.set("utm_medium", params.utm_medium);
  if (params?.utm_campaign) url.searchParams.set("utm_campaign", params.utm_campaign);
  return url.toString();
}

/** Canaux d’acquisition des prospects admission CFA. */
export const CFA_LEAD_SOURCES = [
  { value: "jpo", label: "JPO" },
  { value: "website", label: "Site web" },
  { value: "sea", label: "SEA" },
  { value: "seo", label: "SEO" },
  { value: "social", label: "Réseaux sociaux" },
  { value: "referral", label: "Bouche à oreille" },
  { value: "partner", label: "Partenaire" },
  { value: "salon", label: "Salon / forum" },
  { value: "phone", label: "Téléphone" },
  { value: "email", label: "E-mail" },
  { value: "other", label: "Autre" },
] as const;

export type CfaLeadSource = (typeof CFA_LEAD_SOURCES)[number]["value"];

export const CFA_EDUCATION_LEVELS = [
  "Bac en cours",
  "Bac obtenu",
  "Bac+1",
  "Bac+2",
  "Bac+3 ou plus",
] as const;

export function isCfaLeadSource(value: string): value is CfaLeadSource {
  return CFA_LEAD_SOURCES.some((item) => item.value === value);
}

export function getCfaLeadSourceLabel(value: string | null | undefined): string {
  if (!value) return "Non renseignée";
  return CFA_LEAD_SOURCES.find((item) => item.value === value)?.label ?? value;
}

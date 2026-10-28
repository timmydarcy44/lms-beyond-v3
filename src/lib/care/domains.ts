export const CARE_DOMAINS = [
  { id: "emotions", label: "Émotions & stress", program: "Balance" },
  { id: "attention", label: "Attention & organisation", program: "Focus" },
  { id: "famille", label: "Famille & parentalité", program: "Family" },
  { id: "couple", label: "Couple & vie intime", program: "Duo" },
  { id: "performance", label: "Performance", program: "Peak" },
  { id: "carriere", label: "Carrière & transitions", program: "Shift" },
] as const;

export type CareDomain = (typeof CARE_DOMAINS)[number]["id"];

export const CARE_DOMAIN_IDS: CareDomain[] = CARE_DOMAINS.map((item) => item.id);

export function isCareDomain(value: string): value is CareDomain {
  return CARE_DOMAIN_IDS.includes(value as CareDomain);
}

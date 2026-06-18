export const COMPANY_SIZE_BANDS = [
  { value: "1-10", label: "1 – 10 salariés" },
  { value: "11-50", label: "11 – 50 salariés" },
  { value: "51-200", label: "51 – 200 salariés" },
  { value: "201-500", label: "201 – 500 salariés" },
  { value: "500+", label: "500 salariés et +" },
] as const;

export type CompanySizeBand = (typeof COMPANY_SIZE_BANDS)[number]["value"];

export function isValidCompanySizeBand(value: string): value is CompanySizeBand {
  return COMPANY_SIZE_BANDS.some((band) => band.value === value);
}

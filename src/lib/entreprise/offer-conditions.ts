export const BENEFIT_OPTIONS = [
  { code: "mutuelle", label: "Mutuelle" },
  { code: "teletravail_partiel", label: "Télétravail partiel" },
  { code: "titres_restaurant", label: "Titres-restaurant" },
  { code: "primes", label: "Primes sur objectifs" },
  { code: "transports", label: "Transports remboursés" },
  { code: "formation_byound", label: "Formation Byound" },
  { code: "vehicule", label: "Véhicule" },
  { code: "rtt", label: "RTT" },
] as const;

export type OfferBenefit = { code: string; label: string };
export type SalaryPeriod = "month" | "year";
export type FreelancePayMode = "ca" | "ca_fixe" | "tjm";

export const FREELANCE_PAY_MODES: Array<{ id: FreelancePayMode; label: string }> = [
  { id: "ca", label: "% de CA uniquement" },
  { id: "ca_fixe", label: "% de CA + fixe" },
  { id: "tjm", label: "Taux journalier" },
];

export function eurosToCents(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function centsToInput(cents: number | null | undefined) {
  if (cents == null || !Number.isFinite(cents)) return "";
  const euros = cents / 100;
  return Number.isInteger(euros) ? String(euros) : String(euros).replace(".", ",");
}

export function formatCents(cents: number) {
  const euros = cents / 100;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(euros) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);
  return `${formatted} €`;
}

export function formatOfferPay(min: number | null | undefined, max: number | null | undefined, period: SalaryPeriod | null | undefined) {
  if (min == null || min <= 0) return "";
  const unit = period === "year" ? "an" : "mois";
  if (max != null && max > min) return `${formatCents(min)} – ${formatCents(max)} / ${unit}`;
  return `${formatCents(min)} / ${unit}`;
}

export function formatFreelancePay(mode: FreelancePayMode | null | undefined, percent: number | null | undefined, fixeCents: number | null | undefined, tjmCents: number | null | undefined) {
  if (mode === "ca" && percent != null && percent > 0) return `${percent} % du CA`;
  if (mode === "ca_fixe" && percent != null && percent > 0) {
    const fixe = fixeCents != null && fixeCents > 0 ? ` + ${formatCents(fixeCents)} / mois` : "";
    return `${percent} % du CA${fixe}`;
  }
  if (mode === "tjm" && tjmCents != null && tjmCents > 0) return `${formatCents(tjmCents)} / jour`;
  return "";
}

export function parseFreelancePay(raw: string): {
  mode: FreelancePayMode;
  percent: number | null;
  fixeCents: number | null;
  tjmCents: number | null;
} | null {
  const text = raw.trim();
  if (!text) return null;
  const tjm = text.match(/([\d\s]+(?:[.,]\d+)?)\s*€?\s*\/\s*jour/i);
  if (tjm) {
    const euros = Number(tjm[1].replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(euros) && euros > 0) return { mode: "tjm", percent: null, fixeCents: null, tjmCents: Math.round(euros * 100) };
  }
  const ca = text.match(/([\d]+(?:[.,]\d+)?)\s*%\s*du\s*CA/i);
  if (ca) {
    const percent = Number(ca[1].replace(",", "."));
    const fixe = text.match(/\+\s*([\d\s]+(?:[.,]\d+)?)\s*€/i);
    const fixeEuros = fixe ? Number(fixe[1].replace(/\s/g, "").replace(",", ".")) : null;
    if (Number.isFinite(percent) && percent > 0) {
      return {
        mode: fixeEuros && Number.isFinite(fixeEuros) && fixeEuros > 0 ? "ca_fixe" : "ca",
        percent,
        fixeCents: fixeEuros && Number.isFinite(fixeEuros) && fixeEuros > 0 ? Math.round(fixeEuros * 100) : null,
        tjmCents: null,
      };
    }
  }
  return null;
}

export function parseLegacySalary(raw: string): { min: number | null; max: number | null; period: SalaryPeriod } {
  const text = raw.toLowerCase();
  const period: SalaryPeriod = /\/\s*an\b|par an|annuel/.test(text) ? "year" : "month";
  const numbers = [...raw.replace(/\s/g, "").matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((match) => Number(match[1].replace(",", ".")))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 1_000_000 && (value < 1900 || value > 2100));
  if (!numbers.length) return { min: null, max: null, period };
  const min = Math.round(numbers[0] * 100);
  const max = numbers[1] ? Math.round(numbers[1] * 100) : null;
  return { min, max: max != null && max > min ? max : null, period };
}

function benefitFromLine(line: string): OfferBenefit | null {
  const value = line.trim();
  if (!value) return null;
  const key = value.toLowerCase();
  if (key.includes("mutuelle")) return { code: "mutuelle", label: "Mutuelle" };
  if (key.includes("télétravail") || key.includes("teletravail")) return { code: "teletravail_partiel", label: "Télétravail partiel" };
  if (key.includes("restaurant") || key.includes("ticket")) return { code: "titres_restaurant", label: "Titres-restaurant" };
  if (key.includes("prime")) return { code: "primes", label: "Primes sur objectifs" };
  if (key.includes("transport")) return { code: "transports", label: "Transports remboursés" };
  if (key.includes("formation")) return { code: "formation_byound", label: "Formation Byound" };
  if (key.includes("véhicule") || key.includes("vehicule") || key.includes("voiture")) return { code: "vehicule", label: "Véhicule" };
  if (key === "rtt" || key.includes("rtt")) return { code: "rtt", label: "RTT" };
  return { code: "autre", label: value };
}

export function readLegacyBenefits(description: string) {
  const match = description.match(/\n*Avantages\s*:\s*\n?([\s\S]*)$/i);
  if (!match) return { benefits: [] as OfferBenefit[], description };
  const benefits: OfferBenefit[] = [];
  const free: string[] = [];
  for (const line of match[1].split("\n")) {
    const benefit = benefitFromLine(line.replace(/^[-•]\s*/, ""));
    if (!benefit) continue;
    if (benefit.code === "autre") free.push(benefit.label);
    else if (!benefits.some((item) => item.code === benefit.code)) benefits.push(benefit);
  }
  if (free.length) benefits.push({ code: "autre", label: free.join(", ") });
  return {
    benefits,
    description: description.slice(0, match.index).trim(),
  };
}

export function monthlyCents(cents: number, period: SalaryPeriod) {
  return period === "year" ? Math.round(cents / 12) : cents;
}

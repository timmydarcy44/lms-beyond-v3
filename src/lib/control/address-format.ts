/** Formate un SIRET en groupes 3 3 3 5. */
export function formatSiretDisplay(raw: string | null | undefined): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length !== 14) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

const LOWER_PARTICLES = new Set([
  "de",
  "des",
  "du",
  "la",
  "le",
  "les",
  "et",
  "en",
  "à",
  "a",
  "d",
  "l",
  "rue",
  "avenue",
  "av",
  "bd",
  "boulevard",
  "impasse",
  "place",
  "allée",
  "allee",
  "chemin",
  "route",
  "cours",
  "square",
  "quai",
]);

function capitalizeToken(token: string, index: number): string {
  if (!token) return token;
  const lower = token.toLocaleLowerCase("fr-FR");
  if (index > 0 && LOWER_PARTICLES.has(lower.replace(/\.$/, ""))) {
    return lower;
  }
  // Conserve les initiales type "É." et les abréviations courtes
  if (/^[A-Za-zÀ-ÿ]\.$/.test(token)) return token.toLocaleUpperCase("fr-FR");
  return lower.charAt(0).toLocaleUpperCase("fr-FR") + lower.slice(1);
}

/** Normalise rue / ville : « 134 rue elise déroche » → « 134 rue Élise Deroche ». */
export function normalizePlaceName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed
    .split(/([\s'-]+)/)
    .map((part, index) => {
      if (/^[\s'-]+$/.test(part)) return part;
      // Ne pas toucher aux chiffres purs / codes
      if (/^\d+[a-zA-Z]?$/.test(part)) return part;
      return capitalizeToken(part, index);
    })
    .join("");
}

export function normalizeOrgAddressFields(input: {
  address_line: string;
  address_zip: string;
  address_city: string;
  address_country?: string;
  siret?: string | null;
}) {
  return {
    address_line: normalizePlaceName(input.address_line),
    address_zip: String(input.address_zip ?? "").replace(/\s+/g, "").trim(),
    address_city: normalizePlaceName(input.address_city),
    address_country: String(input.address_country ?? "FR").trim().toUpperCase() || "FR",
    siret: input.siret ? String(input.siret).replace(/\D/g, "") : null,
  };
}

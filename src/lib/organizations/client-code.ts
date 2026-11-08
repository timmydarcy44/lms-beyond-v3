/** Référence client affichée sur devis / convention (ex. BY-482913). */
export function generateClientCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `BY-${n}`;
}

export function cleanSiretDigits(value: string | null | undefined): string {
  return String(value || "").replace(/\D/g, "");
}

export function isValidSiret14(value: string | null | undefined): boolean {
  return cleanSiretDigits(value).length === 14;
}

export type OrgPostalInput = {
  address_line?: string | null;
  address_zip?: string | null;
  address_city?: string | null;
  siret?: string | null;
};

export function validateOrgPostalRequired(input: OrgPostalInput): string | null {
  if (!String(input.address_line || "").trim()) return "Adresse (n° et rue) obligatoire.";
  if (!String(input.address_zip || "").trim()) return "Code postal obligatoire.";
  if (!String(input.address_city || "").trim()) return "Ville obligatoire.";
  if (!isValidSiret14(input.siret)) return "SIRET obligatoire (14 chiffres).";
  return null;
}

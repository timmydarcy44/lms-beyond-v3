/**
 * Identité émetteur Byound — source unique pour devis / convention / mentions légales.
 * Les PDF et pages publiques doivent importer depuis ici, jamais hardcoder.
 */
import {
  BYOUND_POSTAL_ADDRESS,
  formatPostalAddress,
} from "@/lib/formation-documents/postal-address";

export type CompanyIdentity = {
  legal_name: string;
  legal_form: string;
  siret: string;
  siren: string;
  vat_intra: string;
  nda: string;
  email: string;
  phone: string | null;
  address_line: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  /** Version CGV affichée / enregistrée à l'acceptation. */
  cgv_version: string;
  cgv_public_path: string;
};

/** Valeurs canoniques SAS Byound Business (siège Bretteville-sur-Odon). */
export const BYOUND_COMPANY: CompanyIdentity = {
  legal_name: "SAS Byound Business",
  legal_form: "SAS",
  siret: "13070905800015",
  siren: "130709058",
  vat_intra: "FR30130709058",
  /** NDA — à compléter dans of_settings si différent ; défaut provisoire bloquant si vide. */
  nda: "28280164028",
  email: "contact@byound.fr",
  phone: null,
  address_line: BYOUND_POSTAL_ADDRESS.address_line,
  address_zip: BYOUND_POSTAL_ADDRESS.address_zip,
  address_city: BYOUND_POSTAL_ADDRESS.address_city,
  address_country: BYOUND_POSTAL_ADDRESS.address_country,
  cgv_version: "2026-01",
  cgv_public_path: "/cgv",
};

export function companyPostalAddress(company: CompanyIdentity = BYOUND_COMPANY): string {
  return formatPostalAddress(company);
}

export function companyMissingRequiredFields(
  company: CompanyIdentity = BYOUND_COMPANY,
): string[] {
  const missing: string[] = [];
  if (!company.legal_name?.trim()) missing.push("raison sociale");
  if (String(company.siret || "").replace(/\D/g, "").length !== 14) missing.push("SIRET");
  if (!company.address_line?.trim() || !company.address_city?.trim()) {
    missing.push("adresse");
  }
  if (!company.nda?.trim()) missing.push("numéro de déclaration d'activité (NDA)");
  if (!company.vat_intra?.trim()) missing.push("TVA intracommunautaire");
  return missing;
}

/** Bloque la génération devis/convention si mentions obligatoires absentes. */
export function assertCompanyReadyForQuote(
  company: CompanyIdentity = BYOUND_COMPANY,
): void {
  const missing = companyMissingRequiredFields(company);
  if (missing.length) {
    throw new Error(
      `Identité émetteur incomplète — renseignez : ${missing.join(", ")}.`,
    );
  }
}

export function mergeOfSettingsIntoCompany(
  ofRow: Record<string, unknown> | null | undefined,
): CompanyIdentity {
  const base = { ...BYOUND_COMPANY };
  if (!ofRow) return base;

  const rawName = ofRow.legal_name ? String(ofRow.legal_name).trim() : "";
  if (rawName && rawName !== "Byound") base.legal_name = rawName;

  const siretDigits = String(ofRow.siret || "").replace(/\D/g, "");
  if (siretDigits.length === 14 && !siretDigits.startsWith("901234567")) {
    base.siret = siretDigits;
    base.siren = siretDigits.slice(0, 9);
  }
  if (ofRow.siren && String(ofRow.siren).replace(/\D/g, "").length === 9) {
    base.siren = String(ofRow.siren).replace(/\D/g, "");
  }
  if (ofRow.vat_intra) base.vat_intra = String(ofRow.vat_intra).trim();
  if (ofRow.nda) base.nda = String(ofRow.nda).trim();

  const cityRaw = ofRow.address_city ? String(ofRow.address_city).trim() : "";
  const cityLooksWrong =
    !cityRaw ||
    /rouen/i.test(cityRaw) ||
    /caen/i.test(cityRaw) ||
    cityRaw.toLowerCase() === "paris";

  if (!cityLooksWrong && ofRow.address_line) {
    base.address_line = String(ofRow.address_line);
    base.address_city = cityRaw;
    if (ofRow.address_zip) base.address_zip = String(ofRow.address_zip);
  }
  if (ofRow.address_country) {
    base.address_country = String(ofRow.address_country);
  }

  return base;
}

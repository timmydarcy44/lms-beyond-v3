/** Adresse OF Byound (lieu de formation « chez Byound » + defaults docs). */
export const BYOUND_POSTAL_ADDRESS = {
  address_line: "134 rue Élise Deroche",
  address_zip: "14760",
  address_city: "Bretteville-sur-Odon",
  address_country: "FR",
} as const;

export function formatPostalAddress(parts: {
  address_line?: string | null;
  address_zip?: string | null;
  address_city?: string | null;
}): string {
  const line = String(parts.address_line || "").trim();
  const cityLine = [parts.address_zip, parts.address_city]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");
  return [line, cityLine].filter(Boolean).join(", ");
}

/** Adresse sur 2 lignes (PDF AcroForm : évite le chevauchement sur champs étroits). */
export function formatPostalAddressMultiline(parts: {
  address_line?: string | null;
  address_zip?: string | null;
  address_city?: string | null;
}): string {
  const line = String(parts.address_line || "").trim();
  const cityLine = [parts.address_zip, parts.address_city]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");
  return [line, cityLine].filter(Boolean).join("\n");
}

export function formatByoundPostalAddress(): string {
  return formatPostalAddress(BYOUND_POSTAL_ADDRESS);
}

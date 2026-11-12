import { formatPersonName } from "@/lib/control/account-participants-format";

const ORG_ACRONYMS = new Set([
  "SAS",
  "SARL",
  "SA",
  "SCI",
  "EURL",
  "SASU",
  "SNC",
  "CNB",
  "IA",
  "AI",
  "RH",
  "OPCO",
  "CFA",
  "NTC",
  "MEM",
  "REM",
  "RDC",
  "SAS",
]);

/** KIABI EUROPE → Kiabi Europe ; conserve SAS, SARL, CNB, IA… */
export function formatCompanyName(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "";
  return text
    .split(" ")
    .map((part) => {
      const clean = part.replace(/[^A-Za-zÀ-ÿ0-9]/g, "");
      if (ORG_ACRONYMS.has(clean.toUpperCase()) && clean.length <= 5) {
        return part.replace(clean, clean.toUpperCase());
      }
      return formatPersonName(part);
    })
    .join(" ");
}

export { formatPersonName };

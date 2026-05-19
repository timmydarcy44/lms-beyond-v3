/** Mapping NAF → OPCO (France) — même logique que la fiche apprenant école. */
export function getOpcoFromNaf(naf: string): string {
  if (!naf) return "À vérifier";
  const prefix2 = naf.substring(0, 2);

  if (["64", "65", "66", "69", "70", "71", "72", "73", "74", "75"].includes(prefix2)) return "ATLAS";
  if (["45", "49", "50", "51", "52", "53"].includes(prefix2)) return "OPCO Mobilités";
  if (["10", "11", "13", "14", "15", "16", "17", "18"].includes(prefix2)) return "OCAPIAT";
  if (["01", "02", "03", "05", "06", "07", "08", "09"].includes(prefix2)) return "OPCO 2i";
  if (["41", "42", "43"].includes(prefix2)) return "Constructys";
  if (["46", "47", "77", "79", "81", "82"].includes(prefix2)) return "L'Opcommerce";
  if (["55", "56", "58", "59", "60", "61", "62", "63"].includes(prefix2)) return "OPCO Santé";
  if (["84", "85", "86", "87", "88", "94"].includes(prefix2)) return "AKTO";
  if (["90", "91", "92", "93"].includes(prefix2)) return "AFDAS";
  if (["95", "96"].includes(prefix2)) return "OPCO Uniformation";

  return `À vérifier (NAF: ${naf})`;
}

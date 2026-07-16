/**
 * Résolution OPCO depuis NAF/APE ou IDCC (convention collective).
 * Priorité recommandée : CFADock → IDCC → NAF.
 */

const IDCC_TO_OPCO: Record<string, string> = {
  // AKTO — HCR, restauration, propreté, tourisme…
  "1979": "AKTO",
  "1501": "AKTO",
  "1266": "AKTO",
  "2060": "AKTO",
  "1286": "AKTO",
  "1631": "AKTO",
  "1790": "AKTO",
  "2147": "AKTO",
  "2336": "AKTO",
  "2397": "AKTO",
  "1413": "AKTO",
  // L'Opcommerce — commerce & distribution
  "2216": "L'Opcommerce",
  "1505": "L'Opcommerce",
  "1517": "L'Opcommerce",
  "1527": "L'Opcommerce",
  "1606": "L'Opcommerce",
  "1686": "L'Opcommerce",
  "1880": "L'Opcommerce",
  "1906": "L'Opcommerce",
  "2120": "L'Opcommerce",
  "2156": "L'Opcommerce",
  "2198": "L'Opcommerce",
  "3237": "L'Opcommerce",
  // OPCO Santé
  "1147": "OPCO Santé",
  "1618": "OPCO Santé",
  "2264": "OPCO Santé",
  "2941": "OPCO Santé",
  "413": "OPCO Santé",
  // Constructys
  "1596": "Constructys",
  "1597": "Constructys",
  "1702": "Constructys",
  "2420": "Constructys",
  "2609": "Constructys",
  "2614": "Constructys",
  // AFDAS — culture, médias
  "1285": "AFDAS",
  "2511": "AFDAS",
  "3090": "AFDAS",
  // ATLAS — finance, assurance, conseil
  "478": "ATLAS",
  "500": "ATLAS",
  "843": "ATLAS",
  "1512": "ATLAS",
  "1679": "ATLAS",
  // Mobilités
  "1090": "OPCO Mobilités",
  "1140": "OPCO Mobilités",
  "1486": "OPCO Mobilités",
  "1504": "OPCO Mobilités",
  "1604": "OPCO Mobilités",
  "1672": "OPCO Mobilités",
  // OCAPIAT — agroalimentaire
  "7001": "OCAPIAT",
  "7002": "OCAPIAT",
  "7003": "OCAPIAT",
  // OPCO 2i — industrie, énergie
  "3248": "OPCO 2i",
  "0044": "OPCO 2i",
};

export function getOpcoFromIdcc(idcc: string | null | undefined): string | null {
  if (!idcc) return null;
  const normalized = String(idcc).replace(/\D/g, "");
  return IDCC_TO_OPCO[normalized] ?? null;
}

/** Mapping NAF division (2 premiers chiffres) → OPCO. */
export function getOpcoFromNaf(naf: string): string {
  if (!naf) return "À vérifier";
  const prefix2 = naf.replace(/\./g, "").substring(0, 2);

  if (["64", "65", "66", "69", "70", "71", "72", "73", "74"].includes(prefix2)) return "ATLAS";
  if (["45", "49", "50", "51", "52", "53"].includes(prefix2)) return "OPCO Mobilités";
  if (["10", "11", "12", "13", "14", "15", "16", "17", "18"].includes(prefix2)) return "OCAPIAT";
  if (["01", "02", "03"].includes(prefix2)) return "OCAPIAT";
  if (["05", "06", "07", "08", "09"].includes(prefix2)) return "OPCO 2i";
  if (["41", "42", "43"].includes(prefix2)) return "Constructys";
  if (["46", "47"].includes(prefix2)) return "L'Opcommerce";
  if (["77", "79", "81", "82"].includes(prefix2)) return "L'Opcommerce";
  // Hébergement & restauration (McDonald's NAF 56.x → AKTO, pas OPCO Santé)
  if (["55", "56"].includes(prefix2)) return "AKTO";
  // Santé & action sociale
  if (["86", "87", "88"].includes(prefix2)) return "OPCO Santé";
  if (prefix2 === "75") return "OPCO Santé";
  // Culture, médias, édition
  if (["58", "59", "60", "90", "91", "92"].includes(prefix2)) return "AFDAS";
  // Services aux entreprises, conseil, télécom, informatique
  if (["61", "62", "63", "84", "85", "94"].includes(prefix2)) return "AKTO";
  if (["93"].includes(prefix2)) return "AKTO";
  if (["95", "96"].includes(prefix2)) return "OPCO Uniformation";

  return `À vérifier (NAF: ${naf})`;
}

/** Résout l'OPCO : IDCC prioritaire, puis nom CFADock, puis NAF. */
export function resolveOpcoName(params: {
  naf?: string | null;
  idcc?: string | null;
  cfadockName?: string | null;
}): string {
  const fromCfa = params.cfadockName?.trim();
  if (fromCfa && fromCfa !== "À déterminer") return fromCfa;

  const fromIdcc = getOpcoFromIdcc(params.idcc);
  if (fromIdcc) return fromIdcc;

  return getOpcoFromNaf(params.naf ?? "");
}

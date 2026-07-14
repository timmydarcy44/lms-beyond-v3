import type { PipelineDeal } from "@/lib/crm/pipeline-shared";

export type NafBucket = {
  code: string;
  label: string;
  count: number;
  share: number;
};

const NAF_SECTION_LABELS: Record<string, string> = {
  "01": "Agriculture",
  "02": "Sylviculture",
  "03": "Pêche",
  "05": "Extraction",
  "06": "Énergie",
  "07": "Mines",
  "08": "Autres extractives",
  "09": "Services extractifs",
  "10": "Industrie alimentaire",
  "11": "Boissons",
  "13": "Textile",
  "14": "Habillement",
  "15": "Cuir",
  "16": "Bois",
  "17": "Papier",
  "18": "Imprimerie",
  "20": "Chimie",
  "21": "Pharma",
  "22": "Plastique",
  "23": "Minéraux",
  "24": "Métallurgie",
  "25": "Métallurgie",
  "26": "Électronique",
  "27": "Équipements électriques",
  "28": "Machines",
  "29": "Automobile",
  "30": "Transport",
  "31": "Meubles",
  "32": "Autres industries",
  "33": "Réparation",
  "35": "Énergie",
  "36": "Eau",
  "37": "Assainissement",
  "38": "Déchets",
  "39": "Dépollution",
  "41": "Construction",
  "42": "Génie civil",
  "43": "Travaux spécialisés",
  "45": "Commerce auto",
  "46": "Commerce gros",
  "47": "Commerce détail",
  "49": "Transport",
  "50": "Transport maritime",
  "51": "Transport aérien",
  "52": "Entreposage",
  "53": "Poste / courrier",
  "55": "Hébergement",
  "56": "Restauration",
  "58": "Édition",
  "59": "Audiovisuel",
  "60": "Télécom",
  "61": "Télécom",
  "62": "Informatique",
  "63": "Information",
  "64": "Finance",
  "65": "Assurance",
  "66": "Auxiliaires finance",
  "68": "Immobilier",
  "69": "Juridique / compta",
  "70": "Sièges sociaux",
  "71": "Architecture / ingénierie",
  "72": "R&D",
  "73": "Publicité",
  "74": "Autres spécialisés",
  "75": "Vétérinaire",
  "77": "Location",
  "78": "Emploi",
  "79": "Agences voyage",
  "80": "Sécurité",
  "81": "Services bâtiment",
  "82": "Services admin",
  "84": "Administration",
  "85": "Enseignement",
  "86": "Santé",
  "87": "Hébergement médico-social",
  "88": "Action sociale",
  "90": "Arts / spectacles",
  "91": "Culture",
  "92": "Jeux",
  "93": "Sport / loisirs",
  "94": "Syndicats",
  "95": "Réparation biens",
  "96": "Services personnels",
};

function nafSection(naf: string): string {
  const clean = naf.replace(/\./g, "").trim();
  if (clean.length < 2) return "??";
  return clean.slice(0, 2);
}

export function computeNafBuckets(deals: PipelineDeal[], limit = 8): NafBucket[] {
  const withNaf = deals.filter((d) => d.naf_code && String(d.naf_code).trim().length >= 2);
  if (withNaf.length === 0) return [];

  const counts = new Map<string, number>();
  for (const deal of withNaf) {
    const section = nafSection(String(deal.naf_code));
    counts.set(section, (counts.get(section) ?? 0) + 1);
  }

  const total = withNaf.length;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([code, count]) => ({
      code,
      label: NAF_SECTION_LABELS[code] ?? `NAF ${code}`,
      count,
      share: Math.round((count / total) * 100),
    }));
}

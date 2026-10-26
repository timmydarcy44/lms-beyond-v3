import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";

const HEADCOUNT: Record<string, string> = {
  NN: "Unité non employeuse",
  "00": "0 salarié",
  "01": "1 ou 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
};

type Site = {
  siret?: string;
  adresse?: string;
  code_postal?: string;
  libelle_commune?: string;
  geo_adresse?: string;
  liste_enseignes?: string[];
  nom_commercial?: string;
  activite_principale?: string;
  libelle_activite_principale?: string;
  tranche_effectif_salarie?: string;
};

type Hit = {
  nom_complet?: string;
  nom_raison_sociale?: string;
  activite_principale?: string;
  libelle_activite_principale?: string;
  activite_principale_libelle?: string;
  tranche_effectif_salarie?: string;
  complements?: { liste_idcc?: (string | number)[] };
  siege?: Site;
  matching_etablissements?: Site[];
};

export type RegistryCompany = {
  siret: string;
  companyName: string;
  tradeName: string;
  addressLine: string;
  postalCode: string;
  city: string;
  companyAddress: string;
  nafCode: string;
  nafLabel: string;
  headcountRange: string;
  idcc: string;
  idccLabel: string;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function headcount(code: string) {
  const key = code.trim();
  return HEADCOUNT[key] ?? key;
}

function mapHit(hit: Hit, siretHint: string): RegistryCompany | null {
  const site =
    hit.siege?.siret === siretHint
      ? hit.siege
      : hit.matching_etablissements?.find((item) => item.siret === siretHint) ?? hit.siege;
  const siret = cleanSiret(site?.siret || siretHint);
  if (!isValidSiret(siret)) return null;
  const postalCode = text(site?.code_postal);
  const city = text(site?.libelle_commune);
  const companyAddress = text(site?.geo_adresse || site?.adresse);
  let addressLine = companyAddress;
  if (postalCode) addressLine = addressLine.replace(postalCode, " ");
  if (city) addressLine = addressLine.replace(new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ");
  addressLine = addressLine.replace(/\s+,/g, ",").replace(/,\s*$/, "").replace(/\s{2,}/g, " ").trim();
  const idcc = text(hit.complements?.liste_idcc?.[0]).replace(/\D/g, "");
  const effectif = text(site?.tranche_effectif_salarie || hit.tranche_effectif_salarie);
  return {
    siret,
    companyName: text(hit.nom_raison_sociale || hit.nom_complet),
    tradeName: text(site?.liste_enseignes?.[0] || site?.nom_commercial),
    addressLine: addressLine || text(site?.adresse),
    postalCode,
    city,
    companyAddress,
    nafCode: text(site?.activite_principale || hit.activite_principale),
    nafLabel: text(site?.libelle_activite_principale || hit.libelle_activite_principale || hit.activite_principale_libelle),
    headcountRange: headcount(effectif),
    idcc,
    idccLabel: "",
  };
}

export async function searchRegistry(query: string) {
  const trimmed = query.trim();
  const siret = cleanSiret(trimmed);
  const bySiret = isValidSiret(siret);
  if (!bySiret && trimmed.length < 3) return { companies: [] as RegistryCompany[] };
  const response = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(bySiret ? siret : trimmed)}&per_page=5`,
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error("L'annuaire des entreprises est indisponible.");
  const payload = (await response.json()) as { results?: Hit[] };
  const hits = payload.results ?? [];
  if (bySiret) {
    const match =
      hits.find((item) => item.siege?.siret === siret) ??
      hits.find((item) => item.matching_etablissements?.some((site) => site.siret === siret)) ??
      hits[0];
    const company = match ? mapHit(match, siret) : null;
    return { companies: company ? [company] : [] };
  }
  const companies = hits
    .map((item) => mapHit(item, cleanSiret(item.siege?.siret)))
    .filter((item): item is RegistryCompany => Boolean(item));
  return { companies };
}

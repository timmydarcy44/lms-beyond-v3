export type AlternanceOffer = {
  siret: string;
  companyName: string;
  city: string;
  postalCode: string;
  title: string;
  excerpt: string;
  partner: string;
  sourceUrl: string;
  mentionsTitle: boolean;
  territoryHint: "normandie" | "idf" | "france";
};

const AREAS = [
  { territory: "normandie" as const, latitude: "49.1829", longitude: "-0.3707", radius: "110" },
  { territory: "idf" as const, latitude: "48.8566", longitude: "2.3522", radius: "45" },
  { territory: "france" as const, latitude: "45.764", longitude: "4.8357", radius: "120" },
];

const FRANCE = [
  { latitude: "45.764", longitude: "4.8357" },
  { latitude: "43.2965", longitude: "5.3698" },
  { latitude: "44.8378", longitude: "-0.5792" },
  { latitude: "50.6292", longitude: "3.0573" },
  { latitude: "47.2184", longitude: "-1.5536" },
  { latitude: "43.6045", longitude: "1.4442" },
];

function fold(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function read(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!current || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[key];
  }
  return text(current);
}

function firstText(source: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = read(source, path);
    if (value) return value;
  }
  return "";
}

function publicExcerpt(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/(?:\+33|0)\s*[1-9](?:[\s.]?\d{2}){4}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 280);
}

export function mentionsSeptember2027(start: string, corpus: string) {
  if (start) {
    const date = new Date(start);
    if (!Number.isNaN(date.getTime()) && date.getUTCFullYear() === 2027 && date.getUTCMonth() === 8) return true;
  }
  return /septembre\s*2027|sept\.?\s*2027|09\/2027|9\/2027|rentree\s*2027/.test(fold(corpus));
}

export function mentionsProfessionalTitle(corpus: string) {
  return /titre professionnel|\btitre pro\b|rncp\s?\d{3,}/.test(fold(corpus));
}

function asOffer(raw: unknown, territoryHint: AlternanceOffer["territoryHint"]): AlternanceOffer | null {
  const record = raw as Record<string, unknown>;
  if (record.is_delegated === true) return null;
  const partner = firstText(raw, [["identifier", "partner_label"], ["partner_label"]]);
  if (/recruteur/i.test(partner)) return null;
  const title = firstText(raw, [["offer", "title"], ["job", "title"], ["title"], ["intitule"]]);
  const description = firstText(raw, [["offer", "description"], ["job", "description"], ["description"]]);
  const start = firstText(raw, [["contract", "start"], ["contract", "start_date"], ["job_start_date"]]);
  const corpus = `${title}\n${description}\n${start}`;
  if (!mentionsSeptember2027(start, corpus)) return null;
  const siret = firstText(raw, [["workplace", "siret"], ["company", "siret"], ["siret"]]).replace(/\s/g, "");
  const companyName = firstText(raw, [["workplace", "name"], ["workplace", "brand"], ["company", "name"], ["employer", "name"]]);
  if (!companyName && !siret) return null;
  const sourceUrl = firstText(raw, [["offer", "url"], ["url"]]);
  const safeUrl = /^https:\/\//.test(sourceUrl) && !sourceUrl.startsWith("https://mailto") ? sourceUrl : "";
  return {
    siret,
    companyName,
    city: firstText(raw, [["location", "city"], ["workplace", "location", "city"], ["city"]]),
    postalCode: firstText(raw, [["location", "postal_code"], ["workplace", "location", "postal_code"], ["postal_code"]]),
    title: title || "Alternance",
    excerpt: publicExcerpt(description),
    partner: partner || "La bonne alternance",
    sourceUrl: safeUrl,
    mentionsTitle: mentionsProfessionalTitle(corpus),
    territoryHint,
  };
}

async function searchArea(area: (typeof AREAS)[number], page: number) {
  const key = process.env.LBA_API_KEY?.trim();
  if (!key) throw new Error("Ajoutez LBA_API_KEY, la clé API La bonne alternance, pour lire les offres.");
  const url = new URL("https://api.apprentissage.beta.gouv.fr/api/job/v1/search");
  url.searchParams.set("latitude", area.latitude);
  url.searchParams.set("longitude", area.longitude);
  url.searchParams.set("radius", area.radius);
  url.searchParams.set("page_index", String(page));
  url.searchParams.set("page_size", "50");
  const response = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 401) throw new Error("La clé LBA_API_KEY est refusée par La bonne alternance.");
  if (!response.ok) throw new Error("Les offres d'alternance sont indisponibles.");
  const payload = (await response.json()) as { jobs?: unknown[] };
  return (payload.jobs ?? []).map((job) => asOffer(job, area.territory)).filter((job): job is AlternanceOffer => Boolean(job));
}

export async function findSeptember2027Offers(day: number) {
  if (!process.env.LBA_API_KEY?.trim()) return [];
  const france = FRANCE[day % FRANCE.length];
  const areas = [
    AREAS[0],
    AREAS[1],
    { ...AREAS[2], latitude: france.latitude, longitude: france.longitude },
  ];
  const page = day % 5;
  const found: AlternanceOffer[] = [];
  for (const area of areas) {
    try {
      found.push(...await searchArea(area, page));
    } catch (error) {
      if (found.length === 0 && area === areas[0]) throw error;
    }
  }
  return found;
}

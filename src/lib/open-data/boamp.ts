import { isCallForTender } from "@/lib/open-data/tender";

export type BoampSignal = {
  buyer: string;
  title: string;
  publishedOn: string;
  url: string;
  department: string;
  kind: "formation" | "lms" | "rh";
};

const QUERIES = [
  { q: "formation professionnelle", kind: "formation" },
  { q: "formation continue", kind: "formation" },
  { q: "prestations de formation", kind: "formation" },
  { q: "développement des compétences", kind: "formation" },
  { q: "learning management", kind: "lms" },
  { q: "digital learning", kind: "lms" },
  { q: "LMS", kind: "lms" },
  { q: "SIRH", kind: "rh" },
] as const;

const KEEP = /formation professionnelle|formation continue|prestations? de formation|actions? de formation|plan de formation|d[eé]veloppement des comp[eé]tences|digital learning|learning management|\blms\b|\bsirh\b|syst[eè]me d'information[^.]{0,48}ressources humaines/i;
const DROP = /nettoyage|relogement|travaux |construction |ma[iî]trise d|sc[eé]nographie|impression |fourniture d'ordinateur/i;
const WEAK_BUYER = /^(service info|acheteur|non renseign[eé]|collectivit[eé])$/i;

function sinceDate() {
  return new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function departmentOf(row: { code_departement_prestation?: unknown; code_departement?: unknown }) {
  const direct = String(row.code_departement_prestation ?? "").replace(/\D/g, "");
  const listed = Array.isArray(row.code_departement) ? String(row.code_departement[0] ?? "") : "";
  const digits = (direct || listed).replace(/\D/g, "");
  if (digits.length < 2) return "";
  return digits.startsWith("97") || digits.startsWith("98") ? digits.slice(0, 3) : digits.slice(0, 2);
}

function kindOf(title: string, fallback: BoampSignal["kind"]): BoampSignal["kind"] {
  if (/\bsirh\b|ressources humaines/i.test(title)) return "rh";
  if (/\blms\b|learning management|digital learning/i.test(title)) return "lms";
  return fallback === "rh" || fallback === "lms" ? fallback : "formation";
}

async function searchQuery(query: (typeof QUERIES)[number], since: string) {
  const url = new URL("https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records");
  url.searchParams.set("select", "objet,nomacheteur,dateparution,url_avis,nature,code_departement,code_departement_prestation");
  url.searchParams.set("where", `search(objet,"${query.q}") AND dateparution>=date'${since}'`);
  url.searchParams.set("order_by", "dateparution desc");
  url.searchParams.set("limit", "15");
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("Les avis publics du BOAMP sont indisponibles.");
  const payload = (await response.json()) as {
    results?: {
      objet?: string;
      nomacheteur?: string;
      dateparution?: string;
      url_avis?: string;
      nature?: string;
      code_departement?: unknown;
      code_departement_prestation?: unknown;
    }[];
  };
  return (payload.results ?? []).flatMap((row) => {
    const title = String(row.objet ?? "").replace(/\s+/g, " ").trim();
    const buyer = String(row.nomacheteur ?? "").replace(/\s+/g, " ").trim();
    const publishedOn = String(row.dateparution ?? "").slice(0, 10);
    const source = String(row.url_avis ?? "");
    if (!title || !buyer || buyer.length < 4 || WEAK_BUYER.test(buyer)) return [];
    if (!publishedOn || publishedOn < since) return [];
    if (!KEEP.test(title) || DROP.test(title)) return [];
    if (String(row.nature ?? "") === "APPEL_OFFRE" || isCallForTender(`${title} ${buyer}`)) return [];
    if (!/^https:\/\//.test(source)) return [];
    return [{ buyer, title, publishedOn, url: source, department: departmentOf(row), kind: kindOf(title, query.kind) }];
  });
}

export async function findBoampSignals(day: number) {
  const since = sinceDate();
  const queries = [QUERIES[day % QUERIES.length], QUERIES[(day + 3) % QUERIES.length]];
  const found: BoampSignal[] = [];
  const seen = new Set<string>();
  for (const query of queries) {
    for (const notice of await searchQuery(query, since)) {
      const key = notice.url;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(notice);
    }
  }
  return found;
}

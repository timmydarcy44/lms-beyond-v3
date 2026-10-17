import {
  GLOBAL_SKILL_REFERENTIAL,
  referentialItemName,
  referentialItemSubtitle,
} from "@/lib/profile/competency-referential";

export type CatalogSkillEntry = {
  name: string;
  subtitle?: string;
  category: string;
  aliases: string[];
};

const ACRONYMS = new Set([
  "abm",
  "aida",
  "api",
  "apis",
  "aarr",
  "aarrr",
  "b2b",
  "crm",
  "css",
  "cta",
  "disc",
  "fomo",
  "gtd",
  "ia",
  "idmc",
  "kpi",
  "kpis",
  "okr",
  "pas",
  "pdf",
  "rag",
  "rgpd",
  "roi",
  "sdk",
  "seo",
  "spin",
  "ui",
  "ux",
  "vip",
]);

const BRANDS = new Map<string, string>([
  ["next.js", "Next.js"],
  ["node.js", "Node.js"],
  ["react.js", "React.js"],
  ["typescript", "TypeScript"],
  ["tailwind", "Tailwind"],
  ["python", "Python"],
  ["fastapi", "FastAPI"],
  ["postgresql", "PostgreSQL"],
  ["supabase", "Supabase"],
  ["redis", "Redis"],
  ["docker", "Docker"],
  ["kubernetes", "Kubernetes"],
  ["figma", "Figma"],
  ["hubspot", "HubSpot"],
  ["salesforce", "Salesforce"],
  ["linkedin", "LinkedIn"],
  ["langchain", "LangChain"],
  ["openai", "OpenAI"],
  ["anthropic", "Anthropic"],
  ["vercel", "Vercel"],
  ["make", "Make"],
  ["zapier", "Zapier"],
  ["n8n", "n8n"],
  ["hotjar", "Hotjar"],
  ["linear", "Linear"],
  ["phantombuster", "Phantombuster"],
  ["github", "GitHub"],
  ["pinecone", "Pinecone"],
  ["chroma", "Chroma"],
]);

/** Doublons fusionnés. La clé canonique est le nom affiché. */
const MERGES: Array<{ canonical: string; aliases: string[] }> = [
  {
    canonical: "Prospection téléphonique",
    aliases: ["Cold Calling", "Prospection téléphonique"],
  },
  {
    canonical: "Biais de décision",
    aliases: ["Biais Cognitifs", "Biais de Décision", "Biais cognitifs", "Biais de décision"],
  },
  {
    canonical: "Analyse comportementale (DISC, IDMC)",
    aliases: [
      "Analyse des types de personnalités (DISC)",
      "Profilage DISC & IDMC Appliqué",
      "Analyse Comportementale (Profilage)",
      "Analyse comportementale (profilage)",
    ],
  },
  {
    canonical: "Gestion de portefeuille partenaires",
    aliases: [
      "Gestion de la relation partenaire",
      "Gestion de Portefeuille Partenaires (Fidélisation & Rétention)",
    ],
  },
  {
    canonical: "Créer une urgence légitime",
    aliases: ["Gestion de l'Urgence (FOMO)", "Gestion de l'urgence (FOMO)"],
  },
];

const HIDDEN = new Set(["scraping phantombuster"]);

export function foldSkillKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9.+#]+/g, " ")
    .trim();
}

function restoreToken(token: string, firstWord: boolean): string {
  const lower = token.toLowerCase();
  if (BRANDS.has(lower)) return BRANDS.get(lower)!;
  const bare = lower.replace(/\./g, "");
  if (ACRONYMS.has(bare)) {
    if (bare === "css") return "CSS";
    if (bare === "kpis") return "KPIs";
    if (bare === "apis") return "APIs";
    return bare.toUpperCase();
  }
  if (!firstWord) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Majuscule initiale, le reste en bas de casse, sigles et noms d'outils conservés. */
export function uniformSkillCase(input: string): string {
  let word = 0;
  return input
    .split(/(\s+|[()&,/])/)
    .map((part) => {
      if (!part || /^[\s()&,/]+$/.test(part)) return part;
      word += 1;
      if (part.includes(".") && BRANDS.has(part.toLowerCase())) return BRANDS.get(part.toLowerCase())!;
      return restoreToken(part, word === 1);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

const aliasToCanonical = new Map<string, string>();

function registerAlias(alias: string, canonical: string) {
  aliasToCanonical.set(foldSkillKey(alias), canonical);
  aliasToCanonical.set(foldSkillKey(canonical), canonical);
}

for (const merge of MERGES) {
  registerAlias(merge.canonical, merge.canonical);
  for (const alias of merge.aliases) registerAlias(alias, merge.canonical);
}

for (const group of GLOBAL_SKILL_REFERENTIAL) {
  for (const item of group.items) {
    const original = referentialItemName(item);
    const folded = foldSkillKey(original);
    if (aliasToCanonical.has(folded)) continue;
    if (HIDDEN.has(folded)) {
      registerAlias(original, original);
      continue;
    }
    registerAlias(original, uniformSkillCase(original));
  }
}

export function isHiddenCatalogSkill(name: string): boolean {
  return HIDDEN.has(foldSkillKey(name));
}

export function canonicalSkillName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return aliasToCanonical.get(foldSkillKey(trimmed)) ?? trimmed;
}

export function catalogCategoryFor(name: string): string | null {
  const target = foldSkillKey(canonicalSkillName(name));
  for (const group of GLOBAL_SKILL_REFERENTIAL) {
    for (const item of group.items) {
      const original = referentialItemName(item);
      const canon = canonicalSkillName(original);
      if (foldSkillKey(canon) === target || foldSkillKey(original) === foldSkillKey(name)) {
        return group.category;
      }
    }
  }
  return null;
}

export function listPublicCatalogEntries(): CatalogSkillEntry[] {
  const byName = new Map<string, CatalogSkillEntry>();
  for (const group of GLOBAL_SKILL_REFERENTIAL) {
    for (const item of group.items) {
      const original = referentialItemName(item);
      if (isHiddenCatalogSkill(original)) continue;
      const name = canonicalSkillName(original);
      const existing = byName.get(name);
      const alias = original === name ? null : original;
      if (existing) {
        if (alias && !existing.aliases.includes(alias)) existing.aliases.push(alias);
        continue;
      }
      byName.set(name, {
        name,
        subtitle: referentialItemSubtitle(item),
        category: group.category,
        aliases: alias ? [alias] : [],
      });
    }
  }
  return [...byName.values()];
}

export function publicCatalogCategories(): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const entry of listPublicCatalogEntries()) {
    if (seen.has(entry.category)) continue;
    seen.add(entry.category);
    categories.push(entry.category);
  }
  return categories;
}

export function searchPublicCatalog(query: string, extras: CatalogSkillEntry[] = []): CatalogSkillEntry[] {
  const source = [...listPublicCatalogEntries(), ...extras];
  const raw = query.trim();
  if (!raw) return source;
  const tokens = foldSkillKey(raw).split(" ").filter(Boolean);
  if (!tokens.length) return source;
  return source
    .map((entry) => {
      const hay = foldSkillKey(`${entry.name} ${entry.subtitle ?? ""} ${entry.category} ${entry.aliases.join(" ")}`);
      const score = tokens.reduce((acc, token) => {
        if (foldSkillKey(entry.name).startsWith(token)) return acc + 3;
        if (hay.includes(token)) return acc + 1;
        return acc - 10;
      }, 0);
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name, "fr"))
    .map((row) => row.entry);
}

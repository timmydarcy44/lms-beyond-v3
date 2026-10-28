export type SeoCheckCategory = "contenu" | "technique" | "partage" | "ia";

export type SeoCheckId =
  | "title_length"
  | "description_length"
  | "keyword_in_title"
  | "keyword_in_description"
  | "single_h1"
  | "min_two_h2"
  | "unique_title"
  | "unique_description"
  | "canonical"
  | "og_image"
  | "faq"
  | "ai_summary"
  | "indexable"
  | "jsonld";

export type SeoFaqForScore = { question: string; answer: string };

export type SeoHeadings = {
  h1: string[];
  h2: string[];
  h3?: string[];
};

export type SeoPageForScore = {
  path: string;
  title: string;
  meta_description: string;
  focus_keyword?: string;
  canonical_url?: string;
  og_image_url?: string;
  jsonld_types?: string[];
  h1: string;
  h2: string[];
  headings?: SeoHeadings | null;
  faq: SeoFaqForScore[];
  /** true/false after HTML crawl (lot 4). undefined = FAQ marketing injectée, on suppose visible. */
  faqVisibleOnPage?: boolean;
  ai_summary: string;
  noindex: boolean;
};

export type SeoScorePeer = {
  path: string;
  title: string;
  meta_description: string;
};

export type SeoCheckResult = {
  id: SeoCheckId;
  label: string;
  category: SeoCheckCategory;
  weight: number;
  passed: boolean;
  message: string;
};

export type SeoScoreResult = {
  score: number;
  totalWeight: number;
  earnedWeight: number;
  checks: SeoCheckResult[];
};

type SeoCheckDef = {
  id: SeoCheckId;
  label: string;
  category: SeoCheckCategory;
  weight: number;
  test: (page: SeoPageForScore, peers: SeoScorePeer[]) => boolean;
  message: (page: SeoPageForScore, peers: SeoScorePeer[]) => string;
};

const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;
const AI_SUMMARY_MIN_WORDS = 80;

export function foldSeoText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function seoWordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function containsKeyword(haystack: string, keyword: string): boolean {
  const needle = foldSeoText(keyword);
  if (!needle) return false;
  return foldSeoText(haystack).includes(needle);
}

function headingList(page: SeoPageForScore, level: "h1" | "h2"): string[] {
  const fromHtml = page.headings?.[level];
  if (Array.isArray(fromHtml)) return fromHtml.map((item) => item.trim()).filter(Boolean);
  if (level === "h1") return page.h1.trim() ? [page.h1.trim()] : [];
  return (page.h2 ?? []).map((item) => item.trim()).filter(Boolean);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function faqItems(page: SeoPageForScore): SeoFaqForScore[] {
  return (page.faq ?? []).filter((item) => item.question.trim() && item.answer.trim());
}

export const SEO_CHECKS: SeoCheckDef[] = [
  {
    id: "title_length",
    label: "Titre 50 à 60 caractères",
    category: "contenu",
    weight: 10,
    test: (page) => {
      const n = page.title.trim().length;
      return n >= TITLE_MIN && n <= TITLE_MAX;
    },
    message: (page) => {
      const n = page.title.trim().length;
      if (!n) return "Title manquant. Visez 50 à 60 caractères.";
      if (n < TITLE_MIN) return `Titre trop court (${n} car.). Idéal 50 à 60.`;
      return `Titre trop long (${n} car.). Google coupe vers 60 caractères.`;
    },
  },
  {
    id: "description_length",
    label: "Meta description 140 à 160 caractères",
    category: "contenu",
    weight: 10,
    test: (page) => {
      const n = page.meta_description.trim().length;
      return n >= DESC_MIN && n <= DESC_MAX;
    },
    message: (page) => {
      const n = page.meta_description.trim().length;
      if (!n) return "Meta description manquante. Idéal 140 à 160 caractères.";
      if (n < DESC_MIN) return `Description trop courte (${n} car.). Idéal 140 à 160.`;
      return `Description trop longue (${n} car.). Google coupe vers 160 caractères.`;
    },
  },
  {
    id: "keyword_in_title",
    label: "Mot-clé dans le titre",
    category: "contenu",
    weight: 6,
    test: (page) => containsKeyword(page.title, page.focus_keyword ?? ""),
    message: (page) =>
      (page.focus_keyword ?? "").trim()
        ? "Le mot-clé principal n'apparaît pas dans le titre."
        : "Renseignez un mot-clé principal, puis placez-le dans le titre.",
  },
  {
    id: "keyword_in_description",
    label: "Mot-clé dans la description",
    category: "contenu",
    weight: 6,
    test: (page) => containsKeyword(page.meta_description, page.focus_keyword ?? ""),
    message: (page) =>
      (page.focus_keyword ?? "").trim()
        ? "Le mot-clé principal n'apparaît pas dans la meta description."
        : "Renseignez un mot-clé principal, puis placez-le dans la description.",
  },
  {
    id: "single_h1",
    label: "Un seul H1",
    category: "contenu",
    weight: 8,
    test: (page) => headingList(page, "h1").length === 1,
    message: (page) => {
      const n = headingList(page, "h1").length;
      if (n === 0) return "Aucun H1 trouvé sur la page.";
      return `Plusieurs H1 (${n}) : un seul H1 par page.`;
    },
  },
  {
    id: "min_two_h2",
    label: "Au moins deux H2",
    category: "contenu",
    weight: 8,
    test: (page) => headingList(page, "h2").length >= 2,
    message: (page) => {
      const n = headingList(page, "h2").length;
      if (n === 0) return "Aucun H2 trouvé : ajoutez-en au moins deux dans le contenu.";
      return `Un seul H2 trouvé : ajoutez-en un dans le contenu.`;
    },
  },
  {
    id: "unique_title",
    label: "Titre unique sur le site",
    category: "technique",
    weight: 6,
    test: (page, peers) => {
      const title = foldSeoText(page.title);
      if (!title) return false;
      return !peers.some((peer) => peer.path !== page.path && foldSeoText(peer.title) === title);
    },
    message: (page, peers) => {
      if (!page.title.trim()) return "Title manquant : il ne peut pas être unique.";
      const title = foldSeoText(page.title);
      const clash = peers.find((peer) => peer.path !== page.path && foldSeoText(peer.title) === title);
      return clash ? `Titre identique à ${clash.path}.` : "Title manquant : il ne peut pas être unique.";
    },
  },
  {
    id: "unique_description",
    label: "Description unique",
    category: "technique",
    weight: 6,
    test: (page, peers) => {
      const desc = foldSeoText(page.meta_description);
      if (!desc) return false;
      return !peers.some((peer) => peer.path !== page.path && foldSeoText(peer.meta_description) === desc);
    },
    message: (page, peers) => {
      if (!page.meta_description.trim()) return "Description manquante : elle ne peut pas être unique.";
      const desc = foldSeoText(page.meta_description);
      const clash = peers.find((peer) => peer.path !== page.path && foldSeoText(peer.meta_description) === desc);
      return clash ? `Description identique à ${clash.path}.` : "Description manquante : elle ne peut pas être unique.";
    },
  },
  {
    id: "canonical",
    label: "URL canonique définie",
    category: "technique",
    weight: 6,
    test: (page) => Boolean(page.canonical_url?.trim()) && isHttpUrl(page.canonical_url!.trim()),
    message: (page) =>
      page.canonical_url?.trim()
        ? "URL canonique invalide. Utilisez une URL https complète."
        : "URL canonique manquante.",
  },
  {
    id: "og_image",
    label: "Image de partage dédiée",
    category: "partage",
    weight: 8,
    test: (page) => Boolean(page.og_image_url?.trim()) && isHttpUrl(page.og_image_url!.trim()),
    message: () => "Ajoutez une image de partage dédiée (1200 × 630).",
  },
  {
    id: "faq",
    label: "FAQ (2 questions min., visible)",
    category: "ia",
    weight: 8,
    test: (page) => {
      const items = faqItems(page);
      if (items.length < 2) return false;
      if (page.faqVisibleOnPage === false) return false;
      return true;
    },
    message: (page) => {
      const items = faqItems(page);
      if (items.length < 2) return "FAQ : deux questions minimum.";
      return "Cette FAQ n'est pas visible sur la page : ajoutez le bloc FAQ.";
    },
  },
  {
    id: "ai_summary",
    label: "Résumé IA d'au moins 80 mots",
    category: "ia",
    weight: 8,
    test: (page) => seoWordCount(page.ai_summary) >= AI_SUMMARY_MIN_WORDS,
    message: (page) => {
      const n = seoWordCount(page.ai_summary);
      if (!n) return "Résumé IA manquant. Visez 80 à 300 mots.";
      return `Résumé IA trop court (${n} mot${n > 1 ? "s" : ""}). 80 mots minimum.`;
    },
  },
  {
    id: "indexable",
    label: "Page indexable",
    category: "technique",
    weight: 4,
    test: (page) => page.noindex !== true,
    message: () => "Page en noindex : elle n'apparaîtra pas dans Google.",
  },
  {
    id: "jsonld",
    label: "Données structurées présentes",
    category: "technique",
    weight: 6,
    test: (page) => (page.jsonld_types ?? []).filter(Boolean).length > 0,
    message: () => "Ajoutez au moins un type de données structurées (Organisation, École, FAQ…).",
  },
];

export function scoreSeoPage(page: SeoPageForScore, peers: SeoScorePeer[] = []): SeoScoreResult {
  const checks: SeoCheckResult[] = SEO_CHECKS.map((def) => {
    const passed = def.test(page, peers);
    return {
      id: def.id,
      label: def.label,
      category: def.category,
      weight: def.weight,
      passed,
      message: passed ? def.label : def.message(page, peers),
    };
  });
  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = checks.filter((item) => item.passed).reduce((sum, item) => sum + item.weight, 0);
  const score = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);
  return { score, totalWeight, earnedWeight, checks };
}

export function seoScoreTone(score: number): "red" | "orange" | "green" {
  if (score >= 80) return "green";
  if (score >= 50) return "orange";
  return "red";
}

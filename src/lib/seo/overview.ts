import { seoScoreTone, type SeoCheckId, type SeoCheckResult } from "@/lib/seo/score";
import { DEFAULT_SEO_TEMPLATE_ROWS } from "@/lib/seo/templates";

export type SeoPageGroup = "Marque" | "Business" | "Apprenants";

export function seoGroupForPath(path: string): SeoPageGroup {
  if (path === "/entreprises" || path.startsWith("/entreprises/") || path.startsWith("/business")) {
    return "Business";
  }
  if (
    path === "/votre-orientation" ||
    path.startsWith("/apprenants") ||
    path.startsWith("/formations") ||
    path.startsWith("/alternance") ||
    path.startsWith("/admissions") ||
    path.startsWith("/ecole") ||
    path.startsWith("/vie-etudiante") ||
    path.startsWith("/financement") ||
    path.startsWith("/online") ||
    path.startsWith("/particuliers") ||
    path.startsWith("/certifications")
  ) {
    return "Apprenants";
  }
  return "Marque";
}

const PILL_BY_CHECK: Record<SeoCheckId, string> = {
  title_length: "Titre hors 50–60",
  description_length: "Description courte",
  keyword_in_title: "Mot-clé absent du titre",
  keyword_in_description: "Mot-clé absent de la description",
  single_h1: "H1",
  min_two_h2: "Pas de H2",
  unique_title: "Titre en double",
  unique_description: "Description en double",
  canonical: "Pas d'URL canonique",
  og_image: "Pas d'image de partage",
  faq: "Pas de FAQ",
  ai_summary: "Résumé IA trop court",
  indexable: "noindex",
  jsonld: "Pas de données structurées",
};

const PRIORITY_LABEL: Record<SeoCheckId, string> = {
  title_length: "Titre trop long (coupé par Google)",
  description_length: "Description trop courte ou absente",
  keyword_in_title: "Pas de mot-clé dans le titre",
  keyword_in_description: "Pas de mot-clé dans la description",
  single_h1: "H1 manquant ou multiple",
  min_two_h2: "Moins de deux sous-titres H2",
  unique_title: "Titres en double",
  unique_description: "Descriptions en double",
  canonical: "URL canonique manquante",
  og_image: "Pas d'image de partage dédiée",
  faq: "Pas de FAQ",
  ai_summary: "Résumé IA trop court",
  indexable: "Page en noindex",
  jsonld: "Données structurées absentes",
};

export function failingCheckPill(check: Pick<SeoCheckResult, "id" | "message">): string {
  if (check.id === "title_length") {
    return check.message.toLowerCase().includes("trop long") ? "Titre trop long" : "Titre trop court";
  }
  if (check.id === "description_length") {
    return check.message.toLowerCase().includes("trop longue") ? "Description trop longue" : "Description courte";
  }
  if (check.id === "single_h1") {
    return check.message.toLowerCase().includes("plusieurs") ? "Plusieurs H1" : "Pas de H1";
  }
  return PILL_BY_CHECK[check.id] ?? check.message;
}

export function priorityCheckLabel(id: SeoCheckId, sampleMessage?: string): string {
  if (id === "title_length" && sampleMessage?.toLowerCase().includes("trop court")) {
    return "Titre trop court";
  }
  return PRIORITY_LABEL[id] ?? sampleMessage ?? id;
}

export function scoreSwatch(score: number) {
  const tone = seoScoreTone(score);
  if (tone === "green") return { fg: "#1F9D57", bg: "#0E2A1D", tone };
  if (tone === "orange") return { fg: "#E7A92C", bg: "#3A2A0E", tone };
  return { fg: "#D6334A", bg: "#3A1418", tone };
}

export type SeoListedPage = {
  path: string;
  label: string;
  group: string;
  score: number;
  checks: SeoCheckResult[];
  impressions?: number | null;
  clicks?: number | null;
};

export function failingPriorityCards(pages: SeoListedPage[]) {
  const map = new Map<SeoCheckId, { id: SeoCheckId; count: number; sampleMessage: string }>();
  for (const page of pages) {
    for (const check of page.checks ?? []) {
      if (check.passed) continue;
      const current = map.get(check.id);
      if (current) current.count += 1;
      else map.set(check.id, { id: check.id, count: 1, sampleMessage: check.message });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .map((item) => ({
      id: item.id,
      count: item.count,
      label: priorityCheckLabel(item.id, item.sampleMessage),
      hot: item.count > 20,
    }));
}

export function filterSeoPages(
  pages: SeoListedPage[],
  opts: { query: string; group: "Toutes" | SeoPageGroup; checkId: SeoCheckId | null; sort: "score" | "impressions" | "clicks" },
) {
  const q = opts.query.trim().toLowerCase();
  const filtered = pages.filter((page) => {
    if (opts.group !== "Toutes" && page.group !== opts.group) return false;
    if (opts.checkId && !(page.checks ?? []).some((check) => check.id === opts.checkId && !check.passed)) return false;
    if (!q) return true;
    return page.label.toLowerCase().includes(q) || page.path.toLowerCase().includes(q);
  });
  const value = (page: SeoListedPage) => {
    if (opts.sort === "impressions") return page.impressions ?? -1;
    if (opts.sort === "clicks") return page.clicks ?? -1;
    return page.score;
  };
  return filtered.sort((a, b) => {
    if (opts.sort === "score") return a.score - b.score || a.path.localeCompare(b.path);
    return value(b) - value(a) || a.score - b.score;
  });
}

export const SEO_TEMPLATE_LABELS: Record<(typeof DEFAULT_SEO_TEMPLATE_ROWS)[number]["type"], string> = {
  job_offer: "Offres d'emploi",
  training: "Formations",
  article: "Articles du blog",
};

export const DEFAULT_SEO_TEMPLATES = DEFAULT_SEO_TEMPLATE_ROWS.map((item) => ({
  ...item,
  label: SEO_TEMPLATE_LABELS[item.type],
}));

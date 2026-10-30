import type { SeoPageForScore } from "@/lib/seo/score";

export type SeoFaqDraft = { question: string; answer: string };

export type SeoDraftFields = {
  title: string;
  meta_description: string;
  h1: string;
  h2: string[];
  og_title: string;
  og_description: string;
  keywords: string[];
  focus_keyword: string;
  canonical_url: string;
  og_image_url: string;
  jsonld_types: string[];
  ai_summary: string;
  faq: SeoFaqDraft[];
  noindex: boolean;
};

export function seoDraftFromPage(page: SeoDraftFields): SeoDraftFields {
  return {
    title: page.title ?? "",
    meta_description: page.meta_description ?? "",
    h1: page.h1 ?? "",
    h2: Array.isArray(page.h2) ? page.h2 : [],
    og_title: page.og_title ?? "",
    og_description: page.og_description ?? "",
    keywords: Array.isArray(page.keywords) ? page.keywords : [],
    focus_keyword: page.focus_keyword ?? "",
    canonical_url: page.canonical_url ?? "",
    og_image_url: page.og_image_url ?? "",
    jsonld_types: Array.isArray(page.jsonld_types) ? page.jsonld_types : [],
    ai_summary: page.ai_summary ?? "",
    faq: Array.isArray(page.faq) ? page.faq : [],
    noindex: page.noindex === true,
  };
}

export function parseSeoDraft(raw: unknown): SeoDraftFields | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const str = (key: string) => String(row[key] ?? "");
  const list = (key: string) => (Array.isArray(row[key]) ? row[key].map(String) : []);
  const faq = Array.isArray(row.faq)
    ? row.faq.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const entry = item as Record<string, unknown>;
        return [{ question: String(entry.question ?? ""), answer: String(entry.answer ?? "") }];
      })
    : [];
  return {
    title: str("title"),
    meta_description: str("meta_description"),
    h1: str("h1"),
    h2: list("h2"),
    og_title: str("og_title"),
    og_description: str("og_description"),
    keywords: list("keywords"),
    focus_keyword: str("focus_keyword"),
    canonical_url: str("canonical_url"),
    og_image_url: str("og_image_url"),
    jsonld_types: list("jsonld_types"),
    ai_summary: str("ai_summary"),
    faq,
    noindex: row.noindex === true,
  };
}

export function applySeoDraft<T extends SeoDraftFields>(page: T, draft: unknown): T {
  const parsed = parseSeoDraft(draft);
  if (!parsed) return page;
  return { ...page, ...parsed };
}

export function draftToScoreInput(
  path: string,
  draft: SeoDraftFields,
  headings?: SeoPageForScore["headings"],
): SeoPageForScore {
  return {
    path,
    title: draft.title,
    meta_description: draft.meta_description,
    focus_keyword: draft.focus_keyword,
    canonical_url: draft.canonical_url,
    og_image_url: draft.og_image_url,
    jsonld_types: draft.jsonld_types,
    h1: draft.h1,
    h2: draft.h2,
    headings: headings ?? null,
    faq: draft.faq,
    ai_summary: draft.ai_summary,
    noindex: draft.noindex,
  };
}

export const CHECK_FIELD_ID: Record<string, string> = {
  title_length: "seo-field-title",
  unique_title: "seo-field-title",
  keyword_in_title: "seo-field-keyword",
  description_length: "seo-field-description",
  unique_description: "seo-field-description",
  keyword_in_description: "seo-field-keyword",
  canonical: "seo-field-canonical",
  og_image: "seo-field-og",
  jsonld: "seo-field-jsonld",
  faq: "seo-field-faq",
  ai_summary: "seo-field-summary",
  indexable: "seo-field-noindex",
  single_h1: "seo-field-headings",
  min_two_h2: "seo-field-headings",
};

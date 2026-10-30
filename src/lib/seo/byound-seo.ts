import type { Metadata } from "next";
import { cache } from "react";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import {
  MARKETING_PAGES,
  getMarketingContent,
  type MarketingPageContent,
  type MarketingPageKey,
} from "@/lib/edge-site/marketing-content";
import { EDGE_MARKETING_PATHS } from "@/lib/edge-site/marketing-routes";
import { parseSeoDraft, type SeoDraftFields } from "@/lib/seo/draft";
import { seoGroupForPath } from "@/lib/seo/overview";
import { faqVisibility, questionAppearsInText, seoHeadingsManagedByTool } from "@/lib/seo/parse-html";
import { scoreSeoPage, type SeoCheckResult, type SeoScorePeer } from "@/lib/seo/score";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type SeoFaqItem = { question: string; answer: string };
export type SeoHeadingsCache = {
  h1: string[];
  h2: string[];
  h3: string[];
  faq_visible?: boolean;
  text?: string;
};
export type SeoPageRecord = {
  path: string;
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
  faq: SeoFaqItem[];
  noindex: boolean;
  score: number | null;
  headings_cache: SeoHeadingsCache | null;
  headings_cached_at: string | null;
  draft: SeoDraftFields | null;
  published_at: string | null;
  updated_at: string | null;
};

export function defaultCanonicalUrl(path: string): string {
  return `${BYOUND_PUBLIC_ORIGIN}${path === "/" ? "/" : path}`;
}
export type SeoCatalogItem = { path: string; label: string; group: string; key?: MarketingPageKey };

export function marketingPathForKey(key: MarketingPageKey): string {
  if (key === "lifeReconversion") return "/online/reconversion";
  const fromRoutes = EDGE_MARKETING_PATHS[key as keyof typeof EDGE_MARKETING_PATHS];
  if (typeof fromRoutes === "string" && fromRoutes.startsWith("/")) return fromRoutes;
  return `/${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

export function emptySeoPage(path: string, fallback?: Partial<SeoPageRecord>): SeoPageRecord {
  return {
    path,
    title: fallback?.title ?? "",
    meta_description: fallback?.meta_description ?? "",
    h1: fallback?.h1 ?? "",
    h2: fallback?.h2 ?? [],
    og_title: fallback?.og_title ?? "",
    og_description: fallback?.og_description ?? "",
    keywords: fallback?.keywords ?? [],
    focus_keyword: fallback?.focus_keyword ?? "",
    canonical_url: fallback?.canonical_url ?? defaultCanonicalUrl(path),
    og_image_url: fallback?.og_image_url ?? "",
    jsonld_types: fallback?.jsonld_types ?? [],
    ai_summary: fallback?.ai_summary ?? "",
    faq: fallback?.faq ?? [],
    noindex: fallback?.noindex ?? false,
    score: fallback?.score ?? null,
    headings_cache: fallback?.headings_cache ?? null,
    headings_cached_at: fallback?.headings_cached_at ?? null,
    draft: fallback?.draft ?? null,
    published_at: fallback?.published_at ?? null,
    updated_at: fallback?.updated_at ?? null,
  };
}

export function byoundSeoCatalog(): SeoCatalogItem[] {
  const extra: SeoCatalogItem[] = [
    { path: "/", label: "Accueil", group: seoGroupForPath("/") },
    { path: "/entreprises", label: "Entreprises", group: seoGroupForPath("/entreprises") },
    { path: "/votre-orientation", label: "Orientation", group: seoGroupForPath("/votre-orientation") },
  ];
  const fromMarketing = (Object.keys(MARKETING_PAGES) as MarketingPageKey[]).map((key) => {
    const path = marketingPathForKey(key);
    return { path, key, label: getMarketingContent(key).label || key, group: seoGroupForPath(path) };
  });
  const map = new Map<string, SeoCatalogItem>();
  for (const item of [...extra, ...fromMarketing]) if (!map.has(item.path)) map.set(item.path, item);
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path, "fr"));
}

export function defaultsForPath(path: string): SeoPageRecord {
  const catalog = byoundSeoCatalog().find((item) => item.path === path);
  if (catalog?.key) {
    const content = getMarketingContent(catalog.key);
    return emptySeoPage(path, {
      title: content.meta.title,
      meta_description: content.meta.description,
      h1: content.hero.title,
      h2: content.sections.map((s) => s.title),
    });
  }
  if (path === "/") {
    return emptySeoPage(path, {
      title: "Byound — Développons les compétences qui feront la différence demain",
      meta_description: "Identifier, former et valoriser les compétences — avec des résultats mesurables.",
      h1: "Développons les compétences qui feront la différence demain",
    });
  }
  return emptySeoPage(path);
}

function parseFaq(raw: unknown): SeoFaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const question = String(row.question ?? "").trim();
    const answer = String(row.answer ?? "").trim();
    return question && answer ? [{ question, answer }] : [];
  });
}

function parseHeadingsCache(raw: unknown): SeoHeadingsCache | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  return {
    h1: list(row.h1),
    h2: list(row.h2),
    h3: list(row.h3),
    faq_visible: typeof row.faq_visible === "boolean" ? row.faq_visible : undefined,
    text: typeof row.text === "string" ? row.text : undefined,
  };
}

function parseStringList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

export const loadSeoOverrides = cache(async () => {
  const db = getServiceRoleClient();
  const map = new Map<string, SeoPageRecord>();
  if (!db) return map;
  const { data, error } = await db.from("site_seo_pages").select("*");
  if (error) return map;
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const path = String(row.path ?? "");
    const keywords = parseStringList(row.keywords);
    map.set(path, {
      path,
      title: String(row.title ?? ""),
      meta_description: String(row.meta_description ?? ""),
      h1: String(row.h1 ?? ""),
      h2: Array.isArray(row.h2) ? row.h2.map(String) : [],
      og_title: String(row.og_title ?? ""),
      og_description: String(row.og_description ?? ""),
      keywords,
      focus_keyword: String(row.focus_keyword ?? keywords[0] ?? ""),
      canonical_url: String(row.canonical_url ?? "") || defaultCanonicalUrl(path),
      og_image_url: String(row.og_image_url ?? ""),
      jsonld_types: parseStringList(row.jsonld_types),
      ai_summary: String(row.ai_summary ?? ""),
      faq: parseFaq(row.faq),
      noindex: row.noindex === true,
      score: typeof row.score === "number" ? row.score : null,
      headings_cache: parseHeadingsCache(row.headings_cache),
      headings_cached_at: typeof row.headings_cached_at === "string" ? row.headings_cached_at : null,
      draft: parseSeoDraft(row.draft),
      published_at: typeof row.published_at === "string" ? row.published_at : null,
      updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    });
  }
  return map;
});

export async function loadSeoPage(path: string): Promise<SeoPageRecord> {
  const defaults = defaultsForPath(path);
  const override = (await loadSeoOverrides()).get(path);
  if (!override) return defaults;
  return {
    ...defaults,
    ...override,
    title: override.title || defaults.title,
    meta_description: override.meta_description || defaults.meta_description,
    h1: override.h1 || defaults.h1,
    h2: override.h2.length ? override.h2 : defaults.h2,
    path,
  };
}

export function seoScore(page: SeoPageRecord, peers: SeoScorePeer[] = []) {
  const scored = scoreSeoPage(
    {
      path: page.path,
      title: page.title,
      meta_description: page.meta_description,
      focus_keyword: page.focus_keyword || page.keywords[0] || "",
      canonical_url: page.canonical_url || defaultCanonicalUrl(page.path),
      og_image_url: page.og_image_url,
      jsonld_types: page.jsonld_types,
      h1: page.h1,
      h2: page.h2,
      headings: page.headings_cache,
      faq: page.faq,
      faqVisibleOnPage: page.headings_cache?.text
        ? faqVisibility(
            page.faq.map((item) => item.question),
            page.headings_cache.text,
          ).allVisible
        : page.headings_cache?.faq_visible,
      ai_summary: page.ai_summary,
      noindex: page.noindex,
    },
    peers.length ? peers : [{ path: page.path, title: page.title, meta_description: page.meta_description }],
  );
  return {
    score: scored.score,
    issues: scored.checks.filter((item) => !item.passed).map((item) => item.message),
    checks: scored.checks as SeoCheckResult[],
  };
}

export function toNextMetadata(page: SeoPageRecord): Metadata {
  const title = page.title || "Byound";
  const description = page.meta_description || undefined;
  const canonical = page.canonical_url?.trim() || defaultCanonicalUrl(page.path);
  return {
    metadataBase: new URL(BYOUND_PUBLIC_ORIGIN),
    title,
    description,
    keywords: page.keywords.length ? page.keywords : undefined,
    alternates: { canonical },
    robots: page.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: page.og_title || title,
      description: page.og_description || description,
      url: canonical,
      siteName: "Byound",
      locale: "fr_FR",
      type: "website",
      images: page.og_image_url ? [{ url: page.og_image_url, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title: page.og_title || title, description: page.og_description || description },
  };
}

export async function generateMarketingMetadata(key: MarketingPageKey): Promise<Metadata> {
  return toNextMetadata(await loadSeoPage(marketingPathForKey(key)));
}

export async function resolveMarketingContent(key: MarketingPageKey): Promise<MarketingPageContent> {
  const base = getMarketingContent(key);
  const seo = await loadSeoPage(marketingPathForKey(key));
  const h2 = seo.h2.filter(Boolean);
  return {
    ...base,
    meta: { title: seo.title || base.meta.title, description: seo.meta_description || base.meta.description },
    hero: { ...base.hero, title: seo.h1 || base.hero.title },
    sections: base.sections.map((section, i) => ({ ...section, title: h2[i] || section.title })),
    faq: seo.faq,
  };
}

export function webpageJsonLd(page: SeoPageRecord) {
  const url = page.canonical_url?.trim() || `${BYOUND_PUBLIC_ORIGIN}${page.path === "/" ? "/" : page.path}`;
  const graph: Array<Record<string, unknown>> = [{ "@type": "WebPage", url, name: page.title, description: page.meta_description, inLanguage: "fr-FR" }];
  for (const type of page.jsonld_types ?? []) {
    if (!type || type === "FAQPage" || type === "WebPage") continue;
    graph.push({ "@type": type, name: type === "Organization" || type === "EducationalOrganization" ? "Byound" : page.title, url, description: page.meta_description });
  }
  const catalogKey = byoundSeoCatalog().find((item) => item.path === page.path)?.key;
  const visibleFaq = page.faq.filter((item) => {
    if (!item.question.trim() || !item.answer.trim()) return false;
    if (page.headings_cache?.text) return questionAppearsInText(item.question, page.headings_cache.text);
    return seoHeadingsManagedByTool(page.path, catalogKey);
  });
  const wantFaq = (page.jsonld_types ?? []).includes("FAQPage") || visibleFaq.length > 0;
  if (wantFaq && visibleFaq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: visibleFaq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Byound",
    url: BYOUND_PUBLIC_ORIGIN,
    description: "Byound identifie, forme et valorise les compétences avec des résultats mesurables.",
  };
}

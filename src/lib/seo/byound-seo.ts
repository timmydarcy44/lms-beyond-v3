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
import { getServiceRoleClient } from "@/lib/supabase/server";

export type SeoFaqItem = { question: string; answer: string };
export type SeoPageRecord = {
  path: string;
  title: string;
  meta_description: string;
  h1: string;
  h2: string[];
  og_title: string;
  og_description: string;
  keywords: string[];
  ai_summary: string;
  faq: SeoFaqItem[];
  noindex: boolean;
  updated_at: string | null;
};
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
    ai_summary: fallback?.ai_summary ?? "",
    faq: fallback?.faq ?? [],
    noindex: fallback?.noindex ?? false,
    updated_at: fallback?.updated_at ?? null,
  };
}

export function byoundSeoCatalog(): SeoCatalogItem[] {
  const extra: SeoCatalogItem[] = [
    { path: "/", label: "Accueil", group: "Marque" },
    { path: "/entreprises", label: "Entreprises", group: "Business" },
    { path: "/votre-orientation", label: "Orientation", group: "Apprenants" },
  ];
  const fromMarketing = (Object.keys(MARKETING_PAGES) as MarketingPageKey[]).map((key) => {
    const path = marketingPathForKey(key);
    return { path, key, label: getMarketingContent(key).label || key, group: "Marque" };
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

export const loadSeoOverrides = cache(async () => {
  const db = getServiceRoleClient();
  const map = new Map<string, SeoPageRecord>();
  if (!db) return map;
  const { data, error } = await db.from("site_seo_pages").select("*");
  if (error) return map;
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const path = String(row.path ?? "");
    map.set(path, {
      path,
      title: String(row.title ?? ""),
      meta_description: String(row.meta_description ?? ""),
      h1: String(row.h1 ?? ""),
      h2: Array.isArray(row.h2) ? row.h2.map(String) : [],
      og_title: String(row.og_title ?? ""),
      og_description: String(row.og_description ?? ""),
      keywords: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
      ai_summary: String(row.ai_summary ?? ""),
      faq: parseFaq(row.faq),
      noindex: row.noindex === true,
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

export function seoScore(page: SeoPageRecord) {
  const issues: string[] = [];
  let score = 0;
  const t = page.title.trim().length;
  if (t >= 45 && t <= 65) score += 20;
  else { issues.push(t ? "Title : viser 50–60 caractères." : "Title manquant."); if (t) score += 8; }
  const d = page.meta_description.trim().length;
  if (d >= 120 && d <= 165) score += 20;
  else { issues.push(d ? "Meta description : viser 140–160 caractères." : "Meta description manquante."); if (d) score += 8; }
  if (page.h1.trim()) score += 15; else issues.push("H1 manquant.");
  if (page.h2.filter(Boolean).length >= 2) score += 15; else issues.push("Ajoutez au moins deux H2.");
  if (page.ai_summary.trim().length >= 80) score += 15; else issues.push("Résumé IA trop court.");
  if (page.faq.length >= 2) score += 10; else issues.push("FAQ : deux questions minimum.");
  if (!page.noindex) score += 5; else issues.push("Page en noindex.");
  return { score: Math.min(100, score), issues };
}

export function toNextMetadata(page: SeoPageRecord): Metadata {
  const title = page.title || "Byound";
  const description = page.meta_description || undefined;
  const canonical = `${BYOUND_PUBLIC_ORIGIN}${page.path === "/" ? "/" : page.path}`;
  return {
    metadataBase: new URL(BYOUND_PUBLIC_ORIGIN),
    title,
    description,
    keywords: page.keywords.length ? page.keywords : undefined,
    alternates: { canonical },
    robots: page.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: page.og_title || title, description: page.og_description || description, url: canonical, siteName: "Byound", locale: "fr_FR", type: "website" },
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
  const url = `${BYOUND_PUBLIC_ORIGIN}${page.path === "/" ? "/" : page.path}`;
  const graph: Array<Record<string, unknown>> = [{ "@type": "WebPage", url, name: page.title, description: page.meta_description, inLanguage: "fr-FR" }];
  if (page.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
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

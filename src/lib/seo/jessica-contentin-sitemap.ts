import type { MetadataRoute } from "next";
import { JESSICA_BLOG_POSTS } from "@/lib/jessica-contentin/jessica-blog-catalog";
import { PARCOURS_GUIDES } from "@/lib/jessica-contentin/parcours-guide-catalog";
import { programmeSlugs } from "@/lib/jessica-contentin/programmes-catalog";

export const JESSICA_SITEMAP_BASE_URL = "https://jessicacontentin.fr";

/** Slugs publics des fiches spécialités (alignés sur `specialites/[slug]/page.tsx`). */
export const JESSICA_SPECIALITE_SLUGS = [
  "confiance-en-soi",
  "gestion-stress",
  "tnd",
  "guidance-parentale",
  "tests",
  "harcelement",
  "orientation-professionnelle",
  "therapie",
  "neuroeducation",
  "strategie-apprentissage",
] as const;

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

type SitemapPathConfig = {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
  lastModified?: Date;
};

const STATIC_PAGES: SitemapPathConfig[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/a-propos", priority: 0.8, changeFrequency: "monthly" },
  { path: "/specialites", priority: 0.9, changeFrequency: "monthly" },
  { path: "/consultations", priority: 0.9, changeFrequency: "monthly" },
  { path: "/orientation", priority: 0.85, changeFrequency: "monthly" },
  { path: "/ressources", priority: 0.85, changeFrequency: "weekly" },
  { path: "/ressources/application-neuro-adaptee", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ressources/cartes-rituel-sommeil", priority: 0.75, changeFrequency: "monthly" },
  { path: "/ressources/telecharger", priority: 0.8, changeFrequency: "weekly" },
  { path: "/parcours-guide", priority: 0.85, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
];

export function jessicaPublicUrl(path: string): string {
  if (!path || path === "/") return JESSICA_SITEMAP_BASE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${JESSICA_SITEMAP_BASE_URL}${normalized}`;
}

export function buildJessicaContentinSitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: jessicaPublicUrl(path),
    lastModified: lastModified ?? now,
    changeFrequency,
    priority,
  }));

  for (const slug of JESSICA_SPECIALITE_SLUGS) {
    entries.push({
      url: jessicaPublicUrl(`/specialites/${slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

  for (const slug of programmeSlugs) {
    entries.push({
      url: jessicaPublicUrl(`/programmes/${slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

  for (const parcours of PARCOURS_GUIDES) {
    entries.push({
      url: jessicaPublicUrl(`/parcours-guide/${parcours.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const post of JESSICA_BLOG_POSTS) {
    entries.push({
      url: jessicaPublicUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}

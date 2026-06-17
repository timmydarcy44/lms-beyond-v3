export type JessicaBlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  readingTimeMinutes: number;
  publishedAt: string;
  author: string;
  authorRole: string;
  /** Balise Title SEO (≤ 60 caractères recommandé) */
  seoTitle: string;
  /** Meta description (≤ 155 caractères recommandé) */
  seoDescription: string;
  canonicalUrl: string;
};

export const JESSICA_BLOG_POSTS: JessicaBlogPostMeta[] = [
  {
    slug: "autisme-recommandations-has-2026",
    title: "Autisme : Ce que disent les nouvelles recommandations de la HAS en 2026",
    excerpt:
      "Intervention précoce, inclusion scolaire, rôle des familles et PCO : décryptage des nouvelles Recommandations de Bonnes Pratiques sur le TSA publiées en février 2026.",
    category: "Neuroéducation",
    tags: ["TSA", "Politiques de santé", "HAS", "Autisme"],
    readingTimeMinutes: 6,
    publishedAt: "2026-02-12",
    author: "Jessica Contentin",
    authorRole: "Psychopédagogue & Spécialiste en neuroéducation près de Caen",
    seoTitle: "Autisme & Recommandations HAS 2026 : Analyse en Neuroéducation",
    seoDescription:
      "Nouvelles recommandations HAS 2026 sur l'autisme (TSA) : intervention précoce, inclusion scolaire, rôle des PCO et changements par rapport à 2012.",
    canonicalUrl: "https://jessicacontentin.fr/blog/autisme-recommandations-has-2026",
  },
];

export const JESSICA_BLOG_BY_SLUG: Record<string, JessicaBlogPostMeta> = Object.fromEntries(
  JESSICA_BLOG_POSTS.map((post) => [post.slug, post]),
);

export function getJessicaBlogPost(slug: string): JessicaBlogPostMeta | undefined {
  return JESSICA_BLOG_BY_SLUG[slug];
}

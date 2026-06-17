/**
 * Pages de présentation des parcours (route Next : `jessica-contentin/programmes/[slug]`).
 * Sur le domaine vitrine, le middleware expose des URL courtes `/programmes/[slug]`.
 * Les fiches SEO longues restent sur `/specialites/[slug]`.
 */

/** Lien public à utiliser partout (cartes home, CTA) — réécrit vers la route interne sur jessicacontentin.fr */
export function programmePresentationHref(slug: string): string {
  return `/programmes/${encodeURIComponent(slug)}`;
}

export type ProgrammeDefinition = {
  slug: string;
  headline: string;
  /** Balise Title SEO */
  seoTitle: string;
  tag: string;
  heroImageUrl: string;
  specialitySlug: string;
  /** Sous-titre court sous le hero */
  intro: string;
  /** Hero type bannière (ex. Apaiser le mental) */
  heroKicker?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  /** Vidéo promotionnelle sous le hero (optionnel) */
  promoVideoUrl?: string;
  promoPosterUrl?: string;
};

const VIDEO_APAISER_MENTAL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/Copie%20de%20Sans%20titre.mp4";

export const PROGRAMMES: ProgrammeDefinition[] = [
  {
    slug: "declic-etudes",
    headline: "APPRENDRE, S'ORIENTER ET RÉUSSIR",
    seoTitle: "Déclic Études : Programme de Neuroéducation pour réussir",
    tag: "Développer des stratégies adaptées à son fonctionnement et construire un projet d'avenir cohérent.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=85",
    specialitySlug: "strategie-apprentissage",
    intro:
      "Des méthodes de travail adaptées à votre profil, pour débloquer les situations scolaires et reconstruire une relation saine aux apprentissages.",
    heroKicker: "Programme",
  },
  {
    slug: "comprendre-pour-apaiser",
    headline: "TDAH, TSA, TROUBLES DYS ET HAUT POTENTIEL",
    seoTitle: "Neuroéducation : Programme pour comprendre et apaiser l'enfant",
    tag: "Comprendre son fonctionnement et développer des stratégies adaptées.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85",
    specialitySlug: "guidance-parentale",
    intro:
      "Un cadre pour comprendre les comportements, désamorcer les tensions et retrouver des échanges plus calmes au quotidien.",
    heroKicker: "Programme",
  },
  {
    slug: "apaiser-le-mental",
    headline: "COMPRENDRE SON FONCTIONNEMENT",
    seoTitle: "Équilibre mental & Neuroéducation : Programme d'accompagnement",
    tag: "Identifier ses besoins cognitifs, émotionnels et comportementaux pour retrouver un meilleur équilibre.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=85",
    specialitySlug: "gestion-stress",
    intro:
      "Identifier les déclencheurs, apaiser le corps et les pensées, et réinstaller des rythmes de vie plus soutenables — à votre rythme.",
    heroKicker: "Programme",
  },
  {
    slug: "trouver-sa-voie",
    headline: "ÉMOTIONS, STRESS ET ADAPTATION",
    seoTitle: "Trouver sa voie : Coaching d'orientation & Neuroéducation",
    tag: "Comprendre les mécanismes du stress afin de développer des stratégies de régulation émotionnelle efficaces.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85",
    specialitySlug: "orientation-professionnelle",
    intro:
      "Exploration des intérêts et des compétences, mise en cohérence avec les filières et les projets — pour avancer avec plus de clarté.",
    heroKicker: "Programme",
    promoVideoUrl: VIDEO_APAISER_MENTAL,
  },
];

export const PROGRAMMES_BY_SLUG: Record<string, ProgrammeDefinition> = Object.fromEntries(
  PROGRAMMES.map((p) => [p.slug, p]),
);

export const programmeSlugs = PROGRAMMES.map((p) => p.slug);

export function getProgramme(slug: string): ProgrammeDefinition | undefined {
  return PROGRAMMES_BY_SLUG[slug];
}

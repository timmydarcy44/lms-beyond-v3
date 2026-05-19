import { EDGE_LAB_GALAXY_ROUTE_SLUG, EDGE_LAB_ONLINE_CATALOG_HREF } from "@/lib/galaxy-branding";

const slug = EDGE_LAB_GALAXY_ROUTE_SLUG;

/** Accent marketing EDGE (rouge vif — edgebs.fr). */
export const EDGE_LAB_ACCENT_HEX = "#FF3B30";

/** Image de fond hero par défaut (fichier dans `public/edge-lab/`, fournie par la DA). */
export const EDGE_LAB_HERO_DEFAULT_IMAGE_PATH = "/edge-lab/hero-ambient.png";

/** Liens marketing EDGE (landing `/edge-lab`). */
export const EDGE_MARKETING_HREFS = {
  /** Vitrine type streaming — cours publiés, navigation par thèmes, test d’orientation. */
  onlineCatalog: "/edge-lab/edge-online",
  entreprises: "/edge-lab/entreprises",
  parcoursIndex: "/edge-lab/parcours",
  /** Catalogue sous galaxie (accès membre). */
  galaxyCatalog: EDGE_LAB_ONLINE_CATALOG_HREF,
  onlineFormations: `/g/${slug}/dashboard/student/learning/formations`,
  formationContinueParcours: `/g/${slug}/dashboard/student/learning/parcours`,
  quiz: "/quiz",
} as const;

/** Fichier par défaut (Supabase) si aucune variable d’environnement n’est définie. */
export const EDGE_LAB_HERO_VIDEO_DEFAULT =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/video%20hero%20(2).mp4" as const;

/**
 * Vidéo de fond hero. Surcharge possible via `NEXT_PUBLIC_EDGE_LAB_HERO_VIDEO`.
 */
export const EDGE_LAB_HERO_VIDEO_URL: string =
  typeof process.env.NEXT_PUBLIC_EDGE_LAB_HERO_VIDEO === "string" &&
  process.env.NEXT_PUBLIC_EDGE_LAB_HERO_VIDEO.trim() !== ""
    ? process.env.NEXT_PUBLIC_EDGE_LAB_HERO_VIDEO.trim()
    : EDGE_LAB_HERO_VIDEO_DEFAULT;

/**
 * Image / poster hero (optionnel). Sans valeur : fond 100 % génératif (mailles + lumière).
 * Ex. : `NEXT_PUBLIC_EDGE_LAB_HERO_POSTER=https://…`
 */
export const EDGE_LAB_HERO_POSTER_URL: string | undefined =
  typeof process.env.NEXT_PUBLIC_EDGE_LAB_HERO_POSTER === "string" &&
  process.env.NEXT_PUBLIC_EDGE_LAB_HERO_POSTER.trim() !== ""
    ? process.env.NEXT_PUBLIC_EDGE_LAB_HERO_POSTER.trim()
    : undefined;

/** URL absolue ou chemin `/…` pour le fond hero sans vidéo. */
export function edgeLabHeroImageSrc(): string {
  return EDGE_LAB_HERO_POSTER_URL ?? EDGE_LAB_HERO_DEFAULT_IMAGE_PATH;
}

/**
 * Médias publics « galaxie » (Supabase Storage), alignés sur le projet utilisé ailleurs (ex. Playmakers).
 * Bucket côté console : `EDGE Lab`, fichier partagé pour le branding apprenant.
 *
 * Les listes thématiques des galaxies **Playmakers** (sport) et **EDGE Lab** (business) sont
 * centralisées dans `playmakers-course-categories` et `edge-lab-course-categories` (builder + apprenant).
 */
export const EDGE_LAB_GALAXY_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/logo_edge_online.png";

/** Slug d’URL utilisé sous `/g/{slug}/…` pour la galaxie EDGE Lab (catalogue & parcours). */
export const EDGE_LAB_GALAXY_ROUTE_SLUG = "edgelab";

/** Entrée « EDGE Online » : catalogue LMS sous branding galaxie. */
export const EDGE_LAB_ONLINE_CATALOG_HREF = `/g/${EDGE_LAB_GALAXY_ROUTE_SLUG}/catalog`;

/** Surface applicative EDGE Online (même UX que galaxie formations, chemins propres /formations avec réécriture sur edgeonline.fr). */
export const EDGE_ONLINE_APP_SURFACE_PATH = "/edgeonline";

const EDGE_LAB_SLUGS = new Set(["edgelab", "edge-lab"]);
const PLAYMAKERS_SLUGS = new Set(["playmakers"]);

export function isEdgeLabOrganizationSlug(slug: string | null | undefined): boolean {
  if (slug == null) return false;
  const s = String(slug).trim().toLowerCase().replace(/_/g, "-");
  return EDGE_LAB_SLUGS.has(s);
}

export function isPlaymakersOrganizationSlug(slug: string | null | undefined): boolean {
  if (slug == null) return false;
  const s = String(slug).trim().toLowerCase().replace(/_/g, "-");
  return PLAYMAKERS_SLUGS.has(s);
}

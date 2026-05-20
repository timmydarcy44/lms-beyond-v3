export const EDGE_SITE_BASE = "/edge-lab";

/** Hero homepage — lifestyle apprenante (Supabase EDGE Lab). */
export const EDGE_HERO_IMAGE_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/product%20builder%20formation%20edge.jpeg";

export const EDGE_HREFS = {
  home: EDGE_SITE_BASE,
  parcours: `${EDGE_SITE_BASE}/parcours`,
  parcoursSlug: (slug: string) => `${EDGE_SITE_BASE}/parcours/${slug}`,
  parcoursTarifs: (slug: string) => `${EDGE_SITE_BASE}/parcours/${slug}/tarifs`,
  edgeOnline: `${EDGE_SITE_BASE}/edge-online`,
  entreprises: `${EDGE_SITE_BASE}/entreprises`,
  orientation: "/votre-orientation",
  postuler: (slug: string) => `/postuler/${slug}`,
  postulerConfirmation: (slug: string) => `/postuler/${slug}/confirmation`,
  login: "/login",
  candidater: "#candidater",
  ecole: "#ecole",
  aPropos: "#a-propos",
} as const;

/** Libellés CTA marketing EDGE */
export const EDGE_CTA_LABELS = {
  nav: "Rejoindre",
  cohort: "Rejoindre la cohorte",
  apply: "Postuler",
} as const;

export const EDGE_SITE_BASE = "/edge-lab";

/** Prochaine cohorte présentielle (Normandie). */
export const EDGE_COHORTE_LABEL = "Rentrée septembre 2026";

/** Badge hero homepage — sans répéter l’année en tête de page. */
export const EDGE_COHORTE_HERO_BADGE = "Normandie · Rentrée septembre · inscriptions ouvertes";

/** Hero homepage — lifestyle apprenante (Supabase EDGE Lab). */
export const EDGE_HERO_IMAGE_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/product%20builder%20formation%20edge.jpeg";

/** Assets marketing homepage EDGE. */
export const EDGE_OPEN_BADGE_IMAGE_PATH = "/edge-lab/open-badge-modern-prospecting.png";
/** MacBook Beyond — dashboard Mes résultats (PNG fond transparent, Supabase EDGE Lab). */
export const EDGE_BEYOND_LAPTOP_IMAGE_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/ordinateur%20home.png";

export const EDGE_HREFS = {
  home: EDGE_SITE_BASE,
  parcours: `${EDGE_SITE_BASE}/parcours`,
  parcoursSlug: (slug: string) => `${EDGE_SITE_BASE}/parcours/${slug}`,
  parcoursTarifs: (slug: string) => `${EDGE_SITE_BASE}/parcours/${slug}/tarifs`,
  edgeOnline: `${EDGE_SITE_BASE}/edge-online`,
  entreprises: `${EDGE_SITE_BASE}/entreprises`,
  tarifs: "/tarifs",
  orientation: "/votre-orientation",
  postuler: (slug: string) => `/postuler/${slug}`,
  postulerConfirmation: (slug: string) => `/postuler/${slug}/confirmation`,
  login: "/login",
  /** Inscription gratuite — espace profil & tests (page edgebs.fr/particuliers) */
  employabilitySignup: "/particuliers",
  /** Inscription entreprise — essai 30 jours (edgebs.fr/entreprises/connexion) */
  entrepriseSignup: "/entreprises/connexion",
  candidater: "/postuler/commercial-ia",
  ecole: "#ecole",
  aPropos: "#a-propos",
} as const;

/** Libellés CTA marketing EDGE */
export const EDGE_CTA_LABELS = {
  nav: "Rejoindre",
  cohort: "Rejoindre la cohorte",
  apply: "Postuler",
} as const;
